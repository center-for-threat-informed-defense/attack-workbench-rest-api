'use strict';

const teamsService = require('../services/teams-service');
const logger = require('../lib/logger');

exports.retrieveAll = function(req, res) {
    const options = {
        offset: req.query.offset || 0,
        limit: req.query.limit || 0,
        search: req.query.search,
        includePagination: req.query.includePagination,
    };

    teamsService.retrieveAll(options, function(err, results) {
        if (err) {
            logger.error('Failed with error: ' + err);
            return res.status(500).send('Unable to get teams. Server error.');
        }
        else {
            if (options.includePagination) {
                logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total team(s)`);
            }
            else {
                logger.debug(`Success: Retrieved ${ results.length } team(s)`);
            }
            return res.status(200).send(results);
        }
    });
};

exports.retrieveById = function(req, res) {
    teamsService.retrieveById(req.params.id, function (err, team) {
        if (err) {
            if (err.message === teamsService.errors.badlyFormattedParameter) {
                logger.warn('Badly formatted teams id: ' + req.params.id);
                return res.status(400).send('Team id is badly formatted.');
            }
            else {
                logger.error('Failed with error: ' + err);
                return res.status(500).send('Unable to get team. Server error.');
            }
        }
        else {
            if (!team) {
                return res.status(404).send('TEam not found.');
            }
            else {
                logger.debug(`Success: Retrieved team with id ${ req.params.id }`);
                return res.status(200).send(team);
            }
        }
    });
};

exports.create = async function(req, res) {
    // Get the data from the request
    const teamData = req.body;

    // Create the user account
    try {
        const team = await teamsService.create(teamData);
        logger.debug(`Success: Created team with id ${ team.id }`);
        return res.status(201).send(team);
    }
    catch(err) {
        if (err.message === teamsService.errors.duplicateName) {
            logger.error("Duplicated team name");
            return res.status(409).send('Team name must be unique.');
        } else {
            logger.error("Failed with error: " + err);
            return res.status(500).send('Unable to create team. Server error.');
        }
        
    }
};

exports.updateFull = function(req, res) {
    // Get the data from the request
    const teamData = req.body;

    // Create the technique
    teamsService.updateFull(req.params.id, teamData, function(err, team) {
        if (err) {
            logger.error("Failed with error: " + err);
            return res.status(500).send("Unable to update team. Server error.");
        }
        else {
            if (!team) {
                return res.status(404).send('Team not found.');
            } else {
                logger.debug("Success: Updated team with id " + team.id);
                return res.status(200).send(team);
            }
        }
    });
};

exports.delete = function(req, res) {
  teamsService.delete(req.params.id, function (err, team) {
        if (err) {
            logger.error('Delete team failed. ' + err);
            return res.status(500).send('Unable to delete team. Server error.');
        }
        else {
            if (!team) {
                return res.status(404).send('Team not found.');
            } else {
                logger.debug("Success: Deleted team with id " + team.id);
                return res.status(204).end();
            }
        }
    });
};

exports.retrieveAllUsers = function(req, res) {
  const options = {
    offset: req.query.offset || 0,
    limit: req.query.limit || 0,
    status: req.query.status,
    role: req.query.role,
    search: req.query.search,
    includePagination: req.query.includePagination,
    includeStixIdentity: req.query.includeStixIdentity
  };

  const teamId = req.params.id;

  teamsService.retrieveAllUsers(teamId, options,function (err, results) {
        if (err) {
            if (err.message === teamsService.errors.notFound) {
                logger.error(`Could not find team with with id ${teamId}. `);
                return res.status(404).send('Team not found');
            } else {
                logger.error('Retrieve users from teamId failed. ' + err);
                return res.status(500).send('Unable to retrieve users. Server error.');
            }
        }
        else {
          if (options.includePagination) {
              logger.debug(`Success: Retrieved ${ results.data.length } of ${ results.pagination.total } total user account(s)`);
          }
          else {
              logger.debug(`Success: Retrieved ${ results.length } user account(s)`);
          }
          return res.status(200).send(results);
        }
    });
};
