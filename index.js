//<!-- GU CPSC 332 Example NodeJS server with Mongoose connecting to MongoDB with multiple files-->

//used for our express module / routing
//https://expressjs.com/en/guide/routing.html
const express = require("express");
const app = express();

//method in express to recognize the incoming Request Object as strings or arrays.
//used for our POST method
app.use(express.urlencoded({
    extended: true
}));

//we want to use embedded javascript "template" files
app.set("view engine", "ejs");

app.use(express.static("public"));

const PORT = process.env.PORT || 8080; //port we will connect to. process.evn.PORT used for Heroku later

//start listening for requests on the specified port
app.listen(PORT, function () {
    console.log("Server listening on port " + PORT);
});

//START of Mongoose configuration code
//MongoDB / Mongoose section of code
const FormResult = require("./models/formresult");
//END of Mongoose configuration code

const VALID_AGREE_VALUES = ["Yes", "Maybe", "No"];

//root path
//respond to get requests at the root URL, e.g., /localhost:8080/
app.get("/form", (req, res) => {
    res.render("form.ejs");
});

//CRUD
//CREATE
//respond to POST requests at specified URL, e.g., /localhost:8080/show/
app.post("/show", (req, res) => {
    console.log("Form Data:");
    console.log(req.body);

    //we want to insert the response into our database, e.g., something like the below
    /*
    data from the form:

    {first: 'Bob', last: 'Smith', check1: 'on', rating: '1', agree: 'Yes'}
    
    MongoDB will add an _id used as primary key, e.g., the above would look like the following if you query MongoDB

    _id: 6371da55dec7641ff49d66f2
    agree: 'Yes'
    check1: 'on'
    first: 'Bob'
    last: 'Smith'
    rating: '1'

    when read from the database
    */

    //Assumption: we are sanitizing and validating data before attempting to insert
    //you are responsible for this! In the below, we would want to reject the data
    //rather than submit it with a default value!
    //We create an object model... object and use the data we receive from our form
    let result = FormResult(
        {
            first: req.body.first,
            last: req.body.last,
            rating: req.body.rating < 0 || req.body.rating > 4 ? -1 : req.body.rating,
            agree: VALID_AGREE_VALUES.includes(req.body.agree) ? req.body.agree : "INVALID RESPONSE",
            check1: req.body.check1 == undefined ? false : true
        });

    //Saving the model data to our database as configured above
    result.save(
        (err, result) => {
            if (err) {
                //note that we are not handling this error! You'll want to do this yourself!
                return console.log("Error: " + err);
            }
            console.log(`Success! Inserted data with _id: ${result._id} into the database.`);
            console.log(result._doc);
            res.redirect("/show");
        });

    //alternate method using the model static method rather than the model object method
    //.create() with the data as the first argument instead of .save()
    // FormResult.create(result, (err, result) => {
    //     if (err) {
    //         return console.log("Error: " + err);
    //     }
    //     console.log(`Success! Inserted data with _id: ${result._id} into the database.`);
    //     console.log(result._doc);
    //     res.redirect("/show");
    // });

});

//READ
//respond to GET requests at specified URL, e.g., /localhost:8080/show/
app.get("/show", (req, res) => {

    //Using the static model method to query the database
    FormResult.find(
        {},
        (err, results) => {
            console.log(results)
            res.render("show.ejs", {
                formResults: results
            });
        });
});

//UPDATE
app.route("/edit/:id")
    .get((req, res) => { //respond to GET requests at specified URL, e.g., /localhost:8080/edit/someIdValue
        //grab the :id parameter value from our URL,
        //this is associated with our database primary key for this example
        let id = req.params.id;

        //Find the document in our MongoDB with the id value from our parameter
        //using the model static method
        FormResult.findById(
            id,
            (err, results) => {
                console.log("Found result: ");
                console.log(results)

                //Build our object to pass on to our ejs to be rendered as HTML
                let result = {
                    _id: id,
                    first: results.first,
                    last: results.last,
                    rating: results.rating,
                    agree: results.agree,
                    check1: results.check1
                };

                res.render("edit.ejs", {
                    response: result
                });
            });

    })
    .post(function (req, res) { //respond to POST requests at specified URL, e.g., /localhost:8080/edit/someIdValue
        //grab the :id parameter value from our URL,
        //this is associated with our database primary key for this example
        let id = req.params.id;

        //no validation of data done here! You absolutely should sanitize and validate
        let first = req.body.first;
        let last = req.body.last;
        let check1 = req.body.check1;
        let rating = req.body.rating;
        let agree = req.body.agree;

        //using the updateOne method and where query
        FormResult
            .where({ _id: id })
            .updateOne({
                $set: {
                    first: first,
                    last: last,
                    check1: check1,
                    rating: rating,
                    agree: agree
                }
            })
            .exec(function (err, result) {
                if (err) return res.send(err);
                res.redirect("/show");
                console.log(`Successfully updated ${result.modifiedCount} record`);
            });

        //alternate method to update using the save method from the find result object
        // Find the student with this ID
        // FormResult.findById(id, function (err, result) {
        //     if (result === null) {
        //         console.log("Record not found");
        //     }
        //     else {
        //         //update values as submitted
        //         result.first = first;
        //         result.last = last;
        //         result.check1 = check1;
        //         result.rating = rating;
        //         result.agree = agree;

        //         result.save(function (err, result) {
        //             res.redirect("/show");
        //             console.log(`(Alternate) Successfully updated ${result.modifiedCount} record`);
        //             console.log(result);
        //         });
        //     }
        // });

    });

//DELETE
//respond to GET requests at specified URL, e.g., /localhost: 8080 / delete /someIdValue/
//clearly this is not safe! It just deletes the matching record with no validation
app.route("/delete/:id")
    .get((req, res) => {
        //grab the :id parameter value from our URL,
        //this is associated with our database primary key for this example
        let id = req.params.id;

        //not necessary but we can grab the value we're about to delete...
        FormResult.findById(
            id,
            (err, results) => {
                console.log(results)

                let result = {
                    _id: id,
                    first: results.first,
                    last: results.last,
                    rating: results.rating,
                    agree: results.agree,
                    check1: results.check1
                };
                console.log("We are about to delete: " + JSON.stringify(result));
            });


        //perform the actual deletion
        FormResult.deleteOne(
            { _id: id },
            (err, result) => {
                console.log(result);

                console.log(`${result.deletedCount} record deleted`);
                res.redirect("/show");
            });

        //alternate method using query:
        // FormResult
        //     .find({ _id: id })
        //     .deleteOne()
        //     .exec((err, result) => {
        //         console.log(result);

        //         console.log(`${result.deletedCount} record deleted`);
        //         res.redirect("/show");
        //     });

    });