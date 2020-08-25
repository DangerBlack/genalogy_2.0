import axios from 'axios';
import {parse} from 'csv';
import * as fs from 'fs';
import * as path from 'path';

const COLOR_CODE = ['#5f0b2b', '#d11638', '#f08801', '#face00', '#ada20b', '#d6e738', '#fb97ab', '#27c346', '#fda7c5', '#fdcbea', '#8173c6', '#b9eaee', '#a52fa5', '#7260c6', '#e1c6fb', '#f7b193', '#e4c029'];
const COLOR_MALE = '#ccf2ff';
const COLOR_FEMALE = '#ffe6ff';

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

async function download_csv(url: string): Promise<any>
{
    const response = await axios.get(url);
    const values = await parse_wrapper(response.data);
    return (values as string[][]).slice(1);
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

function is_common_ancestor(csv: any, madre: string, padre:string)
{
    let count = 0;
    for(const person of csv)
    {
        const padre_son = person[head.FATHER_FULLNAME].trim() !== '' ? person[head.FATHER_FULLNAME].trim().replace(/ /gi,'_') : generate_unkown(person[head.SURNAME].trim().replace(/ /gi,'_'));
        const madre_son = person[head.MOTHER_FULLNAME].trim() !== '' ? person[head.MOTHER_FULLNAME].trim().replace(/ /gi,'_') : person[head.MOTHER_FULLNAME] || '';
        
        if(madre_son === madre && padre_son === padre)
            count++;
    }

    return count > 1;
}

function build_flowchart_from_csv(csv: any)
{
    let flow_chart: string[] = [];
    let family_color = {};

    flow_chart.push(`graph TD`);
    flow_chart.push(`classDef M fill:${COLOR_MALE}`);
    flow_chart.push(`classDef F fill:${COLOR_FEMALE}`);
    
    let used_color_code = 0;
    let link_counter = 0;
    for(const person of csv)
    {
        const padre = person[head.FATHER_FULLNAME].trim() !== '' ? person[head.FATHER_FULLNAME].trim().replace(/ /gi,'_') : generate_unkown(person[head.SURNAME].trim().replace(/ /gi,'_'));
        const madre = person[head.MOTHER_FULLNAME].trim() !== '' ? person[head.MOTHER_FULLNAME].trim().replace(/ /gi,'_') : person[head.MOTHER_FULLNAME] || '';
        const born_year = get_date(person[head["DATE_OF_BIRDTH"]]);
        const death_year = person[head["DATE_OF_DEATH"]] ? get_date(person[head["DATE_OF_DEATH"]]) : '';
        const age = get_age(born_year, death_year);
        const gender = person[head['GENDER']];
 
        const marriage = `${padre}=${madre}`;
        const family_name = person[head.SURNAME] ? person[head.SURNAME].trim().replace(/ /gi,'_') : 'missing';
        const nome = `${person[head.NAME].trim()} ${person[head.SURNAME].trim()}`.trim().replace(/ /gi,'_');

        let link_color = COLOR_CODE[used_color_code];

        if(family_name in family_color)
            link_color = family_color[family_name];
        else
        {
            family_color[family_name] = link_color;
            used_color_code = (used_color_code + 1) % COLOR_CODE.length;
        }

        const common_ancestor = is_common_ancestor(csv, madre, padre)
        if(person[head.FATHER_FULLNAME].trim() !== '' && !flow_chart.includes(`${padre} --> ${marriage}`))
        {
            flow_chart.push(`${marriage}(Marriage)`);
            flow_chart.push(`${padre} --> ${marriage}`);
            link_counter++;
        }

        if(marriage.endsWith('=') && common_ancestor)
            flow_chart.push(`${marriage}[[Missing ancestor]]`);


        if(person[head.MOTHER_FULLNAME].trim() !== '' && !flow_chart.includes(`${madre} --> ${marriage}`))
        {
            flow_chart.push(`${madre} --> ${marriage}`);
            link_counter++;
        }

        const age_string = age ? `(${age})` : '';
        const gender_string = gender ? `:::${gender}` : '';      


        if(!marriage.endsWith('=') || common_ancestor)
        {
            flow_chart.push(`${marriage} --> ${nome}["${nome.replace(/_/gi,' ')}<br />${born_year} - ${death_year} ${age_string}"]${gender_string}`);
            flow_chart.push(`linkStyle ${link_counter} stroke:${link_color}`);
            link_counter++;
        }
        else
            flow_chart.push(`${nome}["${nome.replace(/_/gi,' ')}<br />${born_year} - ${death_year} ${age_string}"]${gender_string}`);

    }  

    return flow_chart.join('\n');
}

async function convert_csv_to_flowchart(url: string, file_name: string)
{
    const csv = await download_csv(url);
    const flow_chart = build_flowchart_from_csv(csv);
    fs.writeFileSync(file_name,flow_chart);
}

convert_csv_to_flowchart(process.env.CSV_URL, path.join(process.env.OUT_FOLDER,'ancestor.mermaid'));

