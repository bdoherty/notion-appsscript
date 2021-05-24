class NotionDB {

  /** Used to access Notion Databases 
   * @constructor
   * @param {string} secret - The secret to access your internal integration, see https://www.notion.so/my-integrations
  */
  constructor(secret) {
    this.secret = secret;
    this.databases = this.listDatabases(); 
  }

  listDatabases() {
    const url = "https://api.notion.com/v1/search";
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',    
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Notion-Version": "2021-05-13"
      },
      payload: JSON.stringify({
        filter: {
          value: 'database',
          property: 'object'
        }
      })
    });
    const { results = [] } = JSON.parse(response.getContentText());
    const databases = results
      .map(({ id, title: [{ plain_text: title }] }) => ({ id, title }))
      .reduce( (obj, db) => {
          obj[db.title] = db.id;
          return obj;
        }, 
        {}
      );
    console.log({ databases });
    return databases;
  }

  update(page_id, properties) {

    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      method: 'patch',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Notion-Version": "2021-05-13"
      },
      payload: JSON.stringify({
        properties: properties
      }),
    });
    console.log(response.getContentText());
    return JSON.parse(response.getContentText());
  }

  get(database_name, title) {
    return this.query(database_name, NotionFilter.filter('Name', NotionFilterTypes.text, NotionFilterCondition.equals, title), 1)[0];
  }

  query(database_name, filter, page_size) {

    const payload = {
      filter: filter
    };
    if(page_size != null) {
      payload.page_size = page_size;
    }

    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${this.databases[database_name]}/query`, {
      method : 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Notion-Version": "2021-05-13"
      },
      payload: JSON.stringify(payload)
    });


    if(response.getResponseCode() == 200) {
      const {results = []} = JSON.parse(response.getContentText());
      return results;
    } else {
      console.error(response.getContentText());
      throw `Error quering ${database_name}`
    }

  }

  /*
  https://developers.notion.com/reference/page#page-property-value
  */
  create(database_name, properties) {

      const response = UrlFetchApp.fetch(`https://api.notion.com/v1/pages`, {
      method : 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Notion-Version": "2021-05-13"
      },
      payload: JSON.stringify({
        parent: {
          database_id: this.databases[database_name]
        },
        properties: properties
      })
    });

    if(response.getResponseCode() == 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error(response.getContentText());
      throw `Error creating ${database_name}`
    }
  }
}


/*
Wrappers to create or update property values
https://developers.notion.com/reference/page#page-property-value
*/
class NotionProp {

  static date(start, end = null) {
    let obj = {
      'date': {
        start: Utilities.formatDate(start, Session.getScriptTimeZone(), "YYYY-MM-dd")
      }
    };
    if(end != null) {
      obj.date.end = Utilities.formatDate(end, Session.getScriptTimeZone(), "YYYY-MM-dd")
    }
    return obj;
  }

  static datetime(start, end = null) {
    let obj = {
      'date': {
        start: Utilities.formatDate(start, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
      }
    };
    if(end != null) {
      obj.date.end = Utilities.formatDate(end, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    }
    return obj;
  }

  static title(content) {
    return {
        title: [NotionProp.text(content)]
    }
  }

  static text(content) {
    return { 
      text: {
        content: content
      }
    }
  };

  static relations(...ids) {
    let obj = {
      relation: []
    };
    for(let i = 0; i < ids.length; i++) {
      obj.relation.push({
        id: ids[i]
      });
    }
    return obj;
  }

  static checkbox(boolean) {
    return {
      checkbox: boolean
    }
  }

  static url(address) {
    return {
      url: address
    }
  }

  static email(address) {
    return {
      email: address
    }
  }
}

const NotionFilterCondition = {
  equals: 'equals',
  does_not_equal: 'does_not_equal',
  contains: 'contains',
  does_not_contain: 'does_not_contain',
  starts_with: 'starts_with',
  ends_with: 'ends_with',
  is_empty: 'is_empty',
  is_not_empty: 'is_not_empty'
}

const NotionFilterTypes = {
  text: 'text',
  number: 'number',
  checkbox: 'checkbox',
  select: 'select',
  multi_select: 'multi_select',
  date: 'date',
  relation: 'relation'
}

class NotionFilter {

  /**
   * Create a filter object 
   * See https://developers.notion.com/reference/post-database-query#post-database-query-filter
   * 
   * @param property type {string} The property name.
   * @param type {NotionFilterTypes}
   * @param condition {NotionFilterCondition}
   * @param value 
   * 
   */
  static filter(property, type, condition, value) {
    let obj = {
      property: property
    };
    obj[type] = {};
    obj[type][condition] = value;
    return obj;
  }

  static and(...filters) {
    let obj = {
      and: []
    };
    for(let i = 0; i < filters.length; i++) {
      obj.and.push(filters[i]);
    }
    return obj;
  }

  static or(...filters) {
    let obj = {
      or: []
    };
    for(let i = 0; i < filters.length; i++) {
      obj.or.push(filters[i]);
    }
    return obj;
  }


}

