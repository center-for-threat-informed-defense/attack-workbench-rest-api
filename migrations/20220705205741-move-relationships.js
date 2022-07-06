'use strict';

module.exports = {
    async up(db, client) {
        const attackObjectsCollection = await db.collection('attackObjects');
        const relationshipsCollection = await db.collection('relationships');

        // Move relationship objects from the attackObjects collection to the relationships collection
        const oldRelationships = await attackObjectsCollection.find({ '__t': 'RelationshipModel' }).toArray();
        console.log(`Found ${ oldRelationships.length } relationships in the attackObjects collection`);

        for (const relationship of oldRelationships) {
            // The relationship should not exist in the relationships collection
            const newRelationship = await relationshipsCollection.findOne({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            if (newRelationship) {
                console.log('Relationship already exists in relationships collection. Will delete from attackObjects collection without adding to relationships collection.');
                attackObjectsCollection.findOneAndDelete({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            }
            else {
//                console.log(`Moving relationships ${ relationship.stix.id }/${ relationship.stix.modified }`);
                // Add the relationship to the relationships collection
                relationship._id = undefined;
                relationship.__t = undefined;
                relationshipsCollection.insertOne(relationship);

                // Remove the relationship from the attackObjects collection
                attackObjectsCollection.findOneAndDelete({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            }
        }
    },

    async down(db, client) {
        const attackObjectsCollection = await db.collection('attackObjects');
        const relationshipsCollection = await db.collection('relationships');

        // Move relationship objects from the relationship collection to the attackObjects collection
        const newRelationships = await relationshipsCollection.find({ }).toArray();
        console.log(`Found ${ newRelationships.length } relationships in the relationships collection`);

        for (const relationship of newRelationships) {
            // The relationship should not exist in the attackObjects collection
            const oldRelationship = await attackObjectsCollection.findOne({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            if (oldRelationship) {
                console.log('Relationship already exists in attackObjects collection. Will delete from attackObjects collection without adding to attackObjects collection.');
                relationshipsCollection.findOneAndDelete({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            }
            else {
                // Add the relationship to the attackObjects collection
                relationship._id = undefined;
                relationship.__t = 'RelationshipModel';
                attackObjectsCollection.insertOne(relationship);

                // Remove the relationship from the relationships collection
                relationshipsCollection.findOneAndDelete({ 'stix.id': relationship.stix.id, 'stix.modified': relationship.stix.modified });
            }
        }
    }
};
