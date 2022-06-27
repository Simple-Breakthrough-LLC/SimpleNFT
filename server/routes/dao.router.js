const express = require("express");
const router = express.Router();
const DAO = require("../schemas/dao.schema");

const ObjectID = require("mongoose").Types.ObjectId;


//For now get all articles, In future maybe /artciles/get?size=50?page=3 where size is page size and page is page number (this would fetch 50 articles  )
router.get("/get/:id", async (req, res) => {
	try {
		const data = await DAO.find({_id: new ObjectID(req.params.id)}, {_id: 0, __v:0});
		res.status(200).json(data);
	} catch (err) {
		console.log("Error fetching dao", err);
	}
});


router.post("/new", async (req, res) => {
	try {
        const {fields} = req.body;

		console.log("Got", req.body)
        if (!fields)
            throw new Error("Missing parameter");
        
        console.log("Got this", fields, user);
        const newDAO = new DAO({...fields});
        let savedDAO = await newDAO.save();

		console.log(data);
		res.status(200).send(data);
	} catch (err) {
		console.log("Error creating DAO", err);
	}
});


router.post("/update", async (req, res) => {
	try {

		// Later , verify whoever is updating is the owner of the DAO
        const {fields, id} = req.body;

        if (!fields || !id)
            throw new Error("Missing parameter");
        
        console.log("Got this", fields, id);
        let result = await DAO.updateOne({_id : new ObjectID(id)},
			{
				$set: {...fields},
			})
		res.status(200).send(id);
	} catch (err) {
		console.log("Error updating DAO", err);
	}
});

module.exports = router