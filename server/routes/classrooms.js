// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom } = require('../db/models');
const { Op } = require('sequelize');
const { INTEGER } = require('sequelize');

// List of classrooms

router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors
    */
    const where = {};

    // Your code here
    const {name} = req.query;

    if (name) {
        where.name = {
            [Op.like]: `%${name}%`
        }
    }

    const {studentLimit} = req.query;


    if(studentLimit) {
        let parts = studentLimit.split(',');
        if (parts.length === 1 && Number.isInteger(+parts[0])){
            where.studentLimit =+studentLimit
        } else if (!Number.isInteger(+parts[0])) {
            errorResult.errors.push({message: 'Student Limit should be an integer'})
        }
        else if (parts.length !== 2 || !+parts[0] || !+parts[1] || +parts[1] < +parts[0]){
            errorResult.errors.push({message: 'Student Limit should be two numbers: min,max'})
        } else {
            where.studentLimit = {
                [Op.between]: [+parts[0], +parts[1]]
            }
        }
    }


    if (errorResult.errors.length !== 0) {
        res.status(400);
        next(errorResult);
    }


    const classrooms = await Classroom.findAll({
        attributes: [ 'id', 'name', 'studentLimit' ],
        where,
        // Phase 1B: Order the Classroom search results
        order: [['name']]
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
            // Include classroom supplies and order supplies by category then
                // name (both in ascending order)
            // Include students of the classroom and order students by lastName
                // then firstName (both in ascending order)
                // (Optional): No need to include the StudentClassrooms
        // Your code here
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom
        // Phase 5A: Find the number of supplies the classroom has and set it as
            // a property of supplyCount on the response
            // Phase 5B: Find the number of students in the classroom and set it as
            // a property of studentCount on the response
            // Phase 5C: Calculate if the classroom is overloaded by comparing the
            // studentLimit of the classroom to the number of students in the
            // classroom
            // Optional Phase 5D: Calculate the average grade of the classroom
            // Your code here
            const {classroomId} = req.params.id;

            const results = await classroom.getSupplies();

            let supplyCount = results.length;

            let students = await classroom.getStudents();
            let studentCount = students.length;


            let classroomJson = classroom.toJSON();
            classroomJson.supplyCount = supplyCount
            classroomJson.studentCount = studentCount;

            if (studentCount > classroomJson.studentLimit){
                classroomJson.overloaded = true
            } else {
                classroomJson.overloaded = false
            }

            res.json(classroomJson);
        });

// Export class - DO NOT MODIFY
module.exports = router;
