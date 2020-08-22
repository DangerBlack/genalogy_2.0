# Genealogy

Genalogy is a tool to create from a csv file a beautiful genealogy tree

# CSV file

The csv file can be created with a gsheet template

the header must contain

|Nome|Cognome|data nascita|luogo nascita|data morte|luogo morte|sesso|padre|madre|dettagli|salma|

# .env file

```
CSV_URL=https://docs.google.com/spreadsheets/d/xxxxxxxxxxxxxxxx/export?format=csv&gid=0
OUT_FOLDER=dist
OUT_FILE=ancestor.mermaid
```

# HOW TO RUN

```
npm i
npm run export:png
```

