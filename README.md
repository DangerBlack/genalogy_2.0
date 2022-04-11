# Genealogy

Genalogy is a tool to create from a csv file a beautiful genealogy tree

# CSV file

The csv file can be created with a gsheet template

the header must contain

|name|surname|date of birdth|birdthplace|date of death|deathplace|gender|father's name|mother's name|details|salma|

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
# Sample

An easy sample on a targaryen genealogy tree without date can be generated using this link:

```
CSV_URL=https://docs.google.com/spreadsheets/d/11ZD9hdK_2Ygxf35npSwWmbWLZMFzLoJnxZ6DLvryq_8/export?format=csv&gid=0
```

![ancestor](https://user-images.githubusercontent.com/6942680/162816018-9abe8d84-0e39-4d66-a033-80cadb0931e4.png)
