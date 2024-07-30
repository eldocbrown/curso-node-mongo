const { MongoClient, ObjectId } = require('mongodb');

 function circulationRepo() {
    
    const url = 'mongodb://localhost:27017';
    const dbName = 'circulation';

    function get(query, limit) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);

                let items = db.collection('newspapers').find(query);

                if (limit > 0) {
                    items = items.limit(limit);
                }

                resolve(await items.toArray());
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function getById(id) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);

                let item = await db.collection('newspapers').findOne({_id: ObjectId.createFromHexString(id)});

                resolve(item);
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function add(item) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                
                const result = await db.collection('newspapers').insertOne(item);

                resolve(result.insertedId.toHexString());
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function update(id, newItem) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                
                const result = await db.collection('newspapers')
                    .findOneAndReplace({_id: ObjectId.createFromHexString(id)}, newItem, {returnDocument: 'after'});

                resolve(result._id.toHexString());
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function remove(id) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                
                const result = await db.collection('newspapers').deleteOne({_id: ObjectId.createFromHexString(id)});

                resolve(result.deletedCount === 1);
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function loadData(data) {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {

                await client.connect();
                const db = client.db(dbName);

                const results = await db.collection('newspapers').insertMany(data);
                resolve(results);
                client.close();

            } catch (error) {
                reject(error);
            }
        });
    }

    function averageFinalists() {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                
                const average = await db.collection('newspapers').aggregate([
                    {$group:
                        {
                            _id: null,
                            avgFinalists: { $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014"}
                        }
                    }
                ]).toArray();

                resolve(average[0].avgFinalists);
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    function averageFinalistsByChange() {
        return new Promise(async (resolve, reject) => {
            const client = new MongoClient(url);
            try {
                await client.connect();
                const db = client.db(dbName);
                
                const averageByChange = await db.collection('newspapers').aggregate([
                    {
                        $project: {
                            "Newspaper": 1,
                            "Pulitzer Prize Winners and Finalists, 1990-2014": 1,
                            "Change in Daily Circulation, 2004-2013": 1,
                            overallChange: {
                                $cond: {
                                    if: { $gte: ["$Change in Daily Circulation, 2004-2013",0]},
                                        then: "positive",
                                        else: "negative"
                                    }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$overallChange",
                            avgFinalists: { $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014"}
                        }
                    }
                ]).toArray();

                resolve(averageByChange);
                client.close();
            } catch (error) {
                reject(error);
            }
        });
    }

    return { loadData, get, getById, add, update, remove, averageFinalists, averageFinalistsByChange }

 }

 module.exports = circulationRepo();