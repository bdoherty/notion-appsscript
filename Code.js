function test() {
  createDaysWeeksAndMonths();
  updateResonanceCalendar();
}

function updateResonanceCalendar() {

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
}

function createDaysWeeksAndMonths() {

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
}

function dayToWeek(date) {

  const dayOfWeek = date.getDay();

  const monday = new Date();
  monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek == 0 ? 6 : 1));

  const sunday = new Date();
  sunday.setDate(date.getDate() - dayOfWeek + (dayOfWeek == 0 ? 0 : 7));

  let weekStartFormat = 'd';
  if(monday.getMonth() != sunday.getMonth()) {
    weekStartFormat += ' MMM'
  }
  if(monday.getYear() != sunday.getYear()) {
    weekStartFormat += ' YYYY'
  }
  const weekName = formatDate(monday, weekStartFormat) + ' - ' + formatDate(sunday, 'd MMM YYYY')

  return {
    weekStart: monday,
    weekFinish: sunday,
    weekName: weekName
  }
}

// https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
function formatDate(date, format) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), format)
}
