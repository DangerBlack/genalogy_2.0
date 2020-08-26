import axios from 'axios';
import {parse} from 'csv';
import * as fs from 'fs';
import * as path from 'path';

const COLOR_CODE = ['#395191','#3b89b0','#69a2b3','#5e905d','#89a64a','#c3b43d','#fbcb08','#feb734','#f57337','#c33e3f','#c33fac','#7343a7'];
const COLOR_MALE = '#ccf2ff';
const COLOR_FEMALE = '#ffe6ff';
const COLOR_MARRIAGE = '#e5dcd2';
const MALE_SIMBOL = '♂';
const FEMALE_SIMBOL = '♀';

enum head
{
    'NAME' = 0,
    'SURNAME',
    'DATE_OF_BIRDTH',
    'BIRDTHPLACE',
    'DATE_OF_DEATH',
    'DEATHPALCE',
    'GENDER',
    'FATHER_FULLNAME',
    'MOTHER_FULLNAME',
    'DETAILS'
}

interface Person
{
    name: string;
    surname: string;
    date_of_birth: string;
    date_of_death: string;
    birdthplace: string;
    deathplace: string;
    gender: string;
    father_fullname: string;
    mother_fullname: string;
    details: string;
}

async function parse_wrapper(data: string)
{
    return new Promise((resolve, reject) => 
    {
        parse(data, (error, output) =>{
            if(error)
                return reject(error);
            
            return resolve(output);
        });
    });
}

async function download_csv(url: string): Promise<Person[]>
{
    const response = await axios.get(url);
    const values = await parse_wrapper(response.data) as string[][];

    const persons = values.map(value => {
        const person: Person = {
            name: value[head.NAME],
            surname: value[head.SURNAME],
            date_of_birth: value[head.DATE_OF_BIRDTH],
            birdthplace: value[head.BIRDTHPLACE],
            date_of_death: value[head.DATE_OF_DEATH],
            deathplace: value[head.DEATHPALCE],
            gender: value[head.GENDER],
            father_fullname: value[head.FATHER_FULLNAME],
            mother_fullname: value[head.MOTHER_FULLNAME],
            details: value[head.DETAILS],
        };
        return person;
    });

    return persons.slice(1);
}

function generate_unkown(last_name?: string)
{
    if(last_name)
        return 'Family_'+last_name;
        
    return 'unkown' + (Math.random()*100).toFixed(0);    
}

function get_date(date?: string)
{
    if(!date)
        return '?';

    if(date.includes('/'))
        return date.split('/')[date.split('/').length - 1];
    
    return date;
}

function get_age(born_year: string, death_year: string)
{
    if(born_year === '?')
        return undefined;

    if(!death_year)
        return (new Date()).getFullYear() - parseInt(born_year, 10);
    
    return parseInt(death_year, 10) - parseInt(born_year, 10);
}

function is_common_ancestor(csv: Person[], madre: string, padre:string)
{
    let count = 0;
    for(const person of csv)
    {
        const padre_son = person.father_fullname.trim() !== '' ? person.father_fullname.trim().replace(/ /gi,'_') : generate_unkown(person.surname.trim().replace(/ /gi,'_'));
        const madre_son = person.mother_fullname.trim() !== '' ? person.mother_fullname.trim().replace(/ /gi,'_') : person.mother_fullname || '';
        
        if(madre_son === madre && padre_son === padre)
            count++;
    }

    return count > 1;
}

function get_simbol_gender(gender: string)
{
    if(!gender)
        return '';
    
    if(gender === 'M')
        return MALE_SIMBOL;
    
    return FEMALE_SIMBOL;
}

function build_flowchart_from_csv(csv: Person[])
{
    let flow_chart: string[] = [];
    let family_color = {};

    flow_chart.push(`graph TD`);
    // flow_chart.push(`classDef M fill:${COLOR_MALE}`);
    // flow_chart.push(`classDef F fill:${COLOR_FEMALE}`);
    flow_chart.push(`classDef Marriage fill: ${COLOR_MARRIAGE},stroke: ${COLOR_MARRIAGE},color: black`);
    flow_chart.push(`classDef MissingAncestor fill: ${COLOR_MARRIAGE},stroke: black, color: black`);
    
    let used_color_code = 0;
    let link_counter = 0;
    for(const person of csv)
    {
        const padre = person.father_fullname.trim() !== '' ? person.father_fullname.trim().replace(/ /gi,'_') : generate_unkown(person.surname.trim().replace(/ /gi,'_'));
        const madre = person.mother_fullname.trim() !== '' ? person.mother_fullname.trim().replace(/ /gi,'_') : person.mother_fullname || '';
        const born_year = get_date(person.date_of_birth);
        const death_year = person.date_of_death ? get_date(person.date_of_death) : '';
        const age = get_age(born_year, death_year);
        const gender = person.gender;
 
        const marriage = `${padre}=${madre}`;
        const family_name = person.surname ? person.surname.trim().replace(/ /gi,'_') : 'missing';
        const nome = `${person.name.trim()} ${person.surname.trim()}`.trim().replace(/ /gi,'_');

        let link_color = COLOR_CODE[used_color_code];

        if(family_name in family_color)
            link_color = family_color[family_name];
        else
        {
            family_color[family_name] = link_color;
            used_color_code = (used_color_code + 1) % COLOR_CODE.length;
        }

        const common_ancestor = is_common_ancestor(csv, madre, padre)
        if(person.father_fullname.trim() !== '' && !flow_chart.includes(`${padre} --> ${marriage}`))
        {
            flow_chart.push(`${marriage}(Marriage):::Marriage`);
            flow_chart.push(`${padre} --> ${marriage}`);
            flow_chart.push(`linkStyle ${link_counter} stroke: ${link_color}, stroke-width: 2px`);
            link_counter++;
        }

        if(marriage.endsWith('=') && common_ancestor)
            flow_chart.push(`${marriage}[[Missing ancestor]]:::MissingAncestor`);


        if(person.mother_fullname.trim() !== '' && !flow_chart.includes(`${madre} --> ${marriage}`))
        {
            flow_chart.push(`${madre} --> ${marriage}`);
            // flow_chart.push(`linkStyle ${link_counter} stroke:${link_color},stroke-width:2px`);
            link_counter++;
        }

        const age_string = age ? `(${age})` : '';
        const gender_string = get_simbol_gender(gender);      

        if(!marriage.endsWith('=') || common_ancestor)
        {
            flow_chart.push(`${marriage} --> ${nome}["${nome.replace(/_/gi,' ')} ${gender_string}<br />${born_year} - ${death_year} ${age_string}"]:::${family_name}`);
            flow_chart.push(`linkStyle ${link_counter} stroke: ${link_color}, stroke-width: 2px`);
            link_counter++;
        }
        else
            flow_chart.push(`${nome}["${nome.replace(/_/gi,' ')} ${gender_string}<br />${born_year} - ${death_year} ${age_string}"]:::${family_name}`);
    }  

    for(const name of Object.keys(family_color))
    {
        flow_chart.push(`classDef ${name} fill: ${family_color[name]}, stroke: ${family_color[name]}, color: white`);
    }

    return flow_chart.join('\n');
}

function order_person(a: Person, b: Person)
{
    if(a.surname === b.surname)
    {
        return get_date(a.date_of_birth) > get_date(b.date_of_birth) ? 1 : -1;
    }

    return a.surname > b.surname ? 1 : -1;
}

async function convert_csv_to_flowchart(url: string, file_name: string)
{
    const csv = await download_csv(url);

    // const order = csv.sort((a: Person, b: Person) => order_person(a, b));

    // for(const person of order)
    //     console.log(person.name, person.surname);

    const flow_chart = build_flowchart_from_csv(csv);
    fs.writeFileSync(file_name,flow_chart);
}

convert_csv_to_flowchart(process.env.CSV_URL, path.join(process.env.OUT_FOLDER,'ancestor.mermaid'));

