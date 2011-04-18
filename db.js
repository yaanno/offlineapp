var Db = {
    
    name : 'Stuffz',
    version : '1.0',
    description : 'Offline App Database',
    size: 50 * 1024 * 1024,
    db : null,
    
    init : function () {
        
        if (!window.openDatabase) {
            return;
        }
        
        // initialize database
        this.db = openDatabase(this.name, this.version, this.description, this.size);
        
        // create tables if needed
        this.setup();
    },
    
    getAll : function (conditions, resultHandler, errorHandler) {
        if (!resultHandler) {
            resultHandler = this.resultHandler;
        }
        if (!errorHandler) {
            errorHandler = this.errorHandler;
        }
        if (!conditions) {
            conditions = '1 = 1';
        }
        this.db.transaction(function (transaction) {
            transaction.executeSql(
                'SELECT * FROM stuff WHERE (?)',
                [conditions],
                resultHandler,
                errorHandler
            );
        });
    },
    
    add : function (data, resultHandler, errorHandler) {
        if (!resultHandler) {
            resultHandler = this.resultHandler;
        }
        if (!errorHandler) {
            errorHandler = this.errorHandler;
        }
        this.db.transaction(function (transaction) {
            transaction.executeSql(
                'INSERT INTO stuff (title, description, uid, preview) VALUES (?,?,?,?);',
                [data.title, data.description, data.uid, data.preview],
                resultHandler,
                errorHandler
            );
        });
    },
    
    remove : function () {
        // delete stuff
    },
    
    setup : function () {
        this.db.transaction(function (transaction) {
            transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS stuff (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL DEFAULT "", description TEXT NOT NULL DEFAULT "", uid TEXT UNIQUE NOT NULL DEFAULT "", preview TEXT NOT NULL DEFAULT "");',
                [],
                this.errorHandler,
                this.resultHandler
            );
        });
    },
    
    errorHandler : function (transaction, error) {
        // do stuff with error
        console.log(transaction, error);
    },
    
    resultHandler : function (transaction, resultset) {
        // do stuff with resultset
        console.log(transaction, resultset);
    }
    
};