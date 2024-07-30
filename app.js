const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const circulationRepo = require('./repos/circulationRepo');
const data = require('./circulation.json');

const url = 'mongodb://localhost:27017';
const dbName = 'circulation';

async function main() {

    const client = new MongoClient(url);

    await client.connect();

    try {
        // ** LOAD **
        const results = await circulationRepo.loadData(data);
        assert.equal(data.length, results.insertedCount);

        // ** GET ALL DATA **
        const getData = await circulationRepo.get();
        assert.equal(data.length, getData.length);

        // ** GET FILTERED DATA **
        const filterData = await circulationRepo.get({Newspaper: getData[4].Newspaper});
        assert.deepEqual(filterData[0], getData[4]);

        // ** GET LIMITED DATA**
        const limitData = await circulationRepo.get({}, 3);
        assert.equal(limitData.length, 3);

        // ** GET_BY_ID **
        const id = getData[4]._id.toString();
        const byId = await circulationRepo.getById(id);
        assert.deepEqual(getData[4], byId);

        // ** ADD **
        newItem = {
            "Newspaper": "My Paper",
            "Daily Circulation, 2004": 4000,
            "Daily Circulation, 2013": 8000,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 2,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 3
        }
        const addedItemId = await circulationRepo.add(newItem);
        assert(addedItemId);
        const addedItemQuery = await circulationRepo.getById(addedItemId);
        assert.equal(newItem.Newspaper, addedItemQuery.Newspaper);

        // ** UPDATE **
        const updatedItemId = await circulationRepo.update(addedItemId, {
            "Newspaper": "My New Paper",
            "Daily Circulation, 2004": 4000,
            "Daily Circulation, 2013": 8000,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 2,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 3
        });
        assert(updatedItemId);
        const updatedItemQuery = await circulationRepo.getById(updatedItemId);
        assert.equal(updatedItemQuery.Newspaper, "My New Paper");

        // ** REMOVE BY ID **
        const removed = await circulationRepo.remove(addedItemId);
        assert(removed);
        const deletedItem = await circulationRepo.getById(addedItemId);
        assert.equal(deletedItem, null);

        // ** AGGREGATE: AVG **
        const averageFinalists = await circulationRepo.averageFinalists();
        assert.equal(averageFinalists, 15.06);

        
    } catch (error) {
        console.log(error);
    } finally {
        const admin = client.db(dbName).admin();

        await client.db(dbName).dropDatabase();
        console.log(await admin.listDatabases());

        client.close();
    }

    

    
}

main();