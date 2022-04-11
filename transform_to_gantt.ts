import {download_csv, get_age, get_date, order_person, Person} from "./transform";
import axios from 'axios';
import {parse} from 'csv';
import * as fs from 'fs';
import * as path from 'path';

const ESTIMATED_AGE_TO_GIVE_BIRTH = 20.3;

function estimate_age_to_give_birth_based_on_year(year: number)
{
    return Math.round((year - 1900)*0.1 + ESTIMATED_AGE_TO_GIVE_BIRTH);
}

function find_child(person: Person, csv: Person[])
{
    return csv.find((who) => who.mother_fullname.trim() === `${person.name} ${person.surname}` || who.father_fullname.trim() === `${person.name} ${person.surname}`);
}

function build_gantt_from_csv(csv: Person[])
{
    let gantt: string[] = [];

    gantt.push(`gantt`);
    gantt.push(`title Annali`);
    gantt.push(`dateFormat  YYYY`);
    gantt.push(`axisFormat  %Y`);
    

    for(const person of csv)
    {
        const name = `${person.name.trim()} ${person.surname.trim()}`.trim().replace(/ /gi,'_');
        let born_year = get_date(person.date_of_birth);

        if(born_year === '?')
        {
            const child = find_child(person, csv);

            if(!child)
                continue;

            const child_born_year = get_date(child.date_of_birth);

            if(child_born_year === '?')
                continue;

            born_year = (parseInt(child_born_year, 10) - estimate_age_to_give_birth_based_on_year(parseInt(child_born_year, 10))).toString();
            console.log(`Assume age of ${name} based on child ${child.name} ${child.surname} - ${born_year}`);
        }

        const death_year = person.date_of_death ? get_date(person.date_of_death) : '';
        let age = get_age(born_year, death_year);

        if(!age)
        {
            console.log(`Assume average lifespan of ${name} based on child ${70}`);
            age = 70;
        }

        gantt.push(`${name} :${born_year}, ${age*360}d`);
    }

    return gantt.join('\n');
}

async function convert_csv_to_gantt(url: string, file_name: string)
{
    const csv = await download_csv(url);

    const order = csv.sort((a: Person, b: Person) => order_person(a, b));

    for(const person of order)
        console.log(person.name, person.surname);

    const gantt = build_gantt_from_csv(order);
    fs.writeFileSync(file_name, gantt);
}


convert_csv_to_gantt(process.env.CSV_URL, path.join(process.env.OUT_FOLDER,'ancestor_gantt.mermaid'));
