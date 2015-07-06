/**
 * Created by Roman on 04.05.2015.
 */

var mongoose = require('mongoose');
var wTrack = function (models) {
    var access = require("../Modules/additions/access.js")(models);
    var wTrackSchema = mongoose.Schemas['wTrack'];

    this.bySales = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        access.getReadAccess(req, req.session.uId, 67, function (access) {
            var options = req.query;
            var startWeek = parseInt(options.week);
            var startYear = parseInt(options.year);
            var endWeek;
            var endYear;
            var startDate;
            var endDate;
            var match;
            var groupBy;

            if (!access) {
                return res.status(403).send();
            }

            if (startWeek >= 40) {
                endWeek = Number(startWeek) + 14 - 53;
                endYear = Number(startYear) + 1;
            } else {
                endWeek = Number(startWeek) + 14;
                endYear = Number(startYear);
            }

            startDate = startYear * 100 + startWeek;
            endDate = endYear * 100 + endWeek;

            match = {
                $and: [
                    {'project._id': {$exists: true}},
                    {'project._id': {$ne: null}},
                    {dateByWeek: {$gte: startDate, $lte: endDate}}
                ]
            };

            groupBy = {
                _id: {
                    employee: '$project.projectmanager._id',
                    year: '$year',
                    week: '$week'
                },
                revenue: {$sum: {$multiply: ["$rate", {$add: ["$1", "$2", "$3", "$4", "$5", "$6", "$7"]}]}}
            };

            WTrack.aggregate([{
                $match: match
            }, {
                $group: groupBy
            }, {$project: {
                year: "$_id.year",
                week: "$_id.week",
                employee: "$_id.employee",
                revenue: 1,
                _id: 0
            }}, {
                $group: {
                    _id: "$employee",
                    root: {$push: "$$ROOT"},
                    total: {$sum: "$revenue"}
                }
            }], function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });

        });
    };

    this.byDepartment = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        access.getReadAccess(req, req.session.uId, 67, function (access) {
            var options = req.query;
            var startWeek = parseInt(options.week);
            var startYear = parseInt(options.year);
            var endWeek;
            var endYear;
            var startDate;
            var endDate;
            var match;
            var groupBy;

            if (!access) {
                return res.status(403).send();
            }

            if (startWeek >= 40) {
                endWeek = Number(startWeek) + 14 - 53;
                endYear = Number(startYear) + 1;
            } else {
                endWeek = Number(startWeek) + 14;
                endYear = Number(startYear);
            }

            //startDate = dateCalc(startWeek, startYear);
            //endDate = dateCalc(endWeek, endYear);
            startDate = startYear * 100 + startWeek;
            endDate = endYear * 100 + endWeek;

            match = {
                dateByWeek: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            groupBy = {
                _id: {
                    department: '$department.departmentName',
                    _id: '$department._id',
                    year: '$year',
                    week: '$week'
                },
                revenue: {$sum: {$multiply: ["$rate", {$add: ["$1", "$2", "$3", "$4", "$5", "$6", "$7"]}]}}
            };

            WTrack.aggregate([{
                $match: match
            }, {
                $group: groupBy
            }, {$project: {
                year: "$_id.year",
                week: "$_id.week",
                department: "$_id.department",
                revenue: 1,
                _id: 0
            }}, {
                $group: {
                    _id: "$department",
                    root: {$push: "$$ROOT"},
                    total: {$sum: "$revenue"}
                }
            }], function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });

        });
    };

    this.paidwtrack = function (req, res, next) {
        var WTrack = models.get(req.session.lastDb, 'wTrack', wTrackSchema);

        access.getReadAccess(req, req.session.uId, 67, function (access) {
            var options = req.query;
            var startMonth = parseInt(options.month) || 7;
            var startYear = parseInt(options.year) || 2014;
            var endMonth = parseInt(options.endMonth) || 7;
            var endYear = parseInt(options.endYear) || 2015;
            var startDate;
            var endDate;
            var match;
            var groupBy;

            if (!access) {
                return res.status(403).send();
            }

            startDate = startYear * 100 + startMonth;
            endDate = endYear * 100 + endMonth;

            match = {
                $and: [
                    {'project._id': {$exists: true}},
                    {'project._id': {$ne: null}},
                    {dateByMonth: {$gt: startDate, $lte: endDate}}
                ]
            };

            groupBy = {
                _id:{
                    assigned: '$project.projectmanager.name',
                    month: '$month',
                    year: '$year'
                },
                revenue: {$sum: '$amount'},
                dateByMonth: {$addToSet: '$dateByMonth'}
            };

            WTrack.aggregate([{
                $match: match
            }, {
                $group: groupBy
            }, {
                $project: {
                    year: "$_id.year",
                    month: "$_id.month",
                    employee: "$_id.assigned",
                    revenue: 1,
                    dateByMonth: 1,
                    _id: 0
                }
            }, {
                $group: {
                    _id: "$employee",
                    root: { $push: "$$ROOT" },
                    total: { $sum: "$revenue" }
                }
            }, {
                $sort: {
                    dateByMonth: -1
                }
            }], function (err, response) {
                if (err) {
                    return next(err);
                }

                res.status(200).send(response);
            });

        });
    };

};

module.exports = wTrack;