# notion-appsscript

This is a simple wrapper around the Notion API for creating a internal integration that works in Google Apps Script at https://script.google.com/. 
See https://www.notion.so/my-integrations to create an integration.

## NotionDB
Use to connect to your databases.
```javascript
class NotionDB {
  constructor(api_secret);
  create(database_name, properties) // create a page in a database
  get(database_name, title); // get a page from a database
  update(update(page_id, properties); //update a page
  query(database_name, filter, page_size); // query a database
}
```

## NotionProp
Create or update property values
```javascript
class NotionProp
  static date(start, end = null);
  static datetime(start, end = null);
  static title(content);
  static text(content);
  static relations(...ids);
  static checkbox(boolean);
  static url(address);
  static email(address);
```

## Filtering

```javascript
class NotionFilter {
  static filter(property, type, condition, value);
  static and(...filters);
  static or(...filters)
}
```
Use `NotionFilterCondition` and `NotionFilterTypes` enums for filter types and conditions.


# Examples

# Create Day, Week and Month Records

```javascript
  const notionDB = new NotionDB(PropertiesService.getScriptProperties().getProperty('notion-secret'));

  const today = new Date();

  const {weekStart, weekEnd, weekName} = dayToWeek(today);
  let week = notionDB.get('Week', weekName)
  if(week == null) {
    week = notionDB.create('Week', {
      Name: NotionProp.title(weekName),
      'Date Range': NotionProp.date(weekStart, weekEnd)
    })
  }

  const monthName = formatDate(today, "MMM YYYY");
  let month = notionDB.get('Month', monthName);
  if(month == null) {
    month = notionDB.create('Month', {
      Name: NotionProp.title(monthName)
    })  
  }

  const dayName = formatDate(today, "d MMM YYYY");
  let day = notionDB.get('My Days', dayName);
  if(day == null) {
    day = notionDB.create('My Days', {
      Name: NotionProp.title( dayName),
      Date: NotionProp.date(today),
      Week: NotionProp.relations(week.id),
      Month: NotionProp.relations(month.id)      
    })
  }
```



# Link Resonance Calendar to Day records automatically.

```javascript
  const notionDB = new NotionDB(PropertiesService.getScriptProperties().getProperty('notion-secret'));

  // find Resonance Calendar records that aren't related to a Day record
  const links = notionDB.query('Resonance Calendar', NotionFilter.filter('Day', NotionFilterTypes.relation, NotionFilterCondition.is_empty, true), 100);
  for(let i = 0; i < links.length; i++) {

    const dayName = formatDate(new Date(links[i].created_time), "d MMM YYYY");
    const day = notionDB.get('My Days', dayName)

    notionDB.update(links[i].id, {
      Day: NotionProp.relations(day.id)
    })
  }
```
