const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../schemas/user.schema");
const Contract = require("../schemas/contract.schema");

const ObjectID = require("mongoose").Types.ObjectId;


//For now get all articles, In future maybe /artciles/get?size=50?page=3 where size is page size and page is page number (this would fetch 50 articles  )
router.get("/get/:id", async (req, res) => {
	try {
		const data = await Contract.find({_id: new ObjectID(req.params.id)}, {_id: 0, __v:0});
		if (data.length == 0)
			res.sendStatus(404);
		res.status(200).json(data[0]);
	} catch (err) {
		console.log("Error fetching articles", err);
		res.sendStatus(404);
	}
});


router.post("/new", async (req, res) => {
	try {
        const {fields, user} = req.body;

		console.log("Got", req.body)
        if (!fields  || !user)
            throw new Error("Missing parameter");
        
        console.log("Got this", fields, user);
        const newContract = new Contract({...fields});
        let savedContract = await newContract.save();

		// Since users can only have 1 contract, assumes that if a new contract is being saved there is a new user
        const newUser = new User({addr: user, contract: savedContract.id});
        let data = await newUser.save();
		console.log(data);
		res.status(200).send(data);
	} catch (err) {
		console.log("Error fetching articles", err);
	}
});


router.post("/update", async (req, res) => {
	try {

		// Later , verify whoever is updating is the owner of the contract
        const {fields, user, id} = req.body;

        if (!fields|| !user)
            throw new Error("Missing parameter");
        
        console.log("Got this", fields, id, user);
        let result = await Contract.updateOne({_id : new ObjectID(id)},
			{
				$set: {...fields},
			})
		console.log("This happenned", result)
		// Since users can only have 1 contract, assumes that if a new contract is being saved there is a new user
		res.status(200).send(id);
	} catch (err) {
		console.log("Error fetching articles", err);
	}
});

module.exports = router