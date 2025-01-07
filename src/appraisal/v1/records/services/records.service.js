const db = require('../../../../../config/knex');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const { parseCSV } = require('../utils/records.utils');  // Import the parseCSV function from records.utils.js

exports.processCSV = async (file, userId) => {
  const sessionId = uuidv4();  

  const records = await parseCSV(file.path);

  // Format records into the required structure before inserting them into the DB
  const formattedRecords = records.map((row) => ({
    user_id: userId,
    session_id: sessionId,
    timestamp: new Date(),
    data: JSON.stringify(row),  // Convert each row to JSON string
  }));

  // Insert records into the database
  await db('records').insert(formattedRecords);

  // Clean up the uploaded file after processing
  fs.unlinkSync(file.path);

  return { sessionId };  // Return the sessionId for the frontend to store in localStorage
};

exports.fetchRecords = async (userId, { sessionId, searchField, searchValue, page = 1, perPage = 10 }) => {
  // If no sessionId is passed, get the most recent sessionId for the user
  if (!sessionId) {
    const latestSession = await db('records')
      .where('user_id', userId)
      .orderBy('timestamp', 'desc')  // Order by timestamp to get the most recent session
      .first();  // Fetch the latest record (session)
    
    sessionId = latestSession ? latestSession.session_id : null;  // Get the most recent sessionId
  }

  // Ensure valid pagination values
  page = parseInt(page, 10) || 1;
  perPage = parseInt(perPage, 10);

  if (isNaN(page) || page <= 0) {
    throw new Error('Page must be a positive integer');
  }
  if (isNaN(perPage) || perPage <= 0) {
    throw new Error('PerPage must be a positive integer');
  }

  const offset = (page - 1) * perPage;

  // Build the query to only fetch records for the given sessionId
  let query = db('records')
    .where('user_id', userId)
    .where('session_id', sessionId) // Ensure we filter by the current session
    .limit(perPage)
    .offset(offset);

  // Apply search filters if provided
  if (searchField && searchValue) {
    searchField = searchField.trim();  // Trim searchField to avoid issues
    searchValue = searchValue.trim();  // Trim searchValue to avoid issues

    // Ensure searchField is correctly targeting keys in JSON (note that 'data' is a stringified JSON)
    query = query.whereRaw('JSON_UNQUOTE(JSON_EXTRACT(data, ?)) LIKE ?', [`$.${searchField}`, `${searchValue}%`]);
  }

  // Fetch filtered records from the database (if any filter applied)
  const records = await query;

  // Get the total record count (for pagination) based on sessionId and filter (if any)
  let totalRecordsQuery = db('records')
    .where('user_id', userId)
    .where('session_id', sessionId);  // Count only the records for the current session

  // Apply search filters if provided for total record count (filtered records)
  if (searchField && searchValue) {
    totalRecordsQuery = totalRecordsQuery.whereRaw('JSON_UNQUOTE(JSON_EXTRACT(data, ?)) LIKE ?', [`$.${searchField}`, `${searchValue}%`]);
  }

  // Get the total count of records (filtered or unfiltered)
  const totalRecords = await totalRecordsQuery.count('id as total');

  // Calculate total pages (based on filtered or unfiltered records)
  const totalPages = Math.ceil(totalRecords[0].total / perPage);

  // Extract valid fields dynamically from the first record's data (if available)
  let validFields = [];
  if (records.length > 0) {
    try {
      // Check if the data is a string and then parse it
      let firstRecord = records[0].data;

      if (typeof firstRecord === 'string') {
        // Try parsing the string as JSON
        firstRecord = JSON.parse(firstRecord);  // Parse only if it's a valid JSON string
      }

      validFields = Object.keys(firstRecord);  // Get the keys (columns) from the first record
    } catch (error) {
      // Log or handle the error for invalid JSON
      console.error('Error parsing data in record:', error);
      throw new Error('Invalid JSON in record data');
    }
  }

  return { 
    records,
    totalRecords: totalRecords[0].total,  // Correct total count of records (filtered or unfiltered)
    totalPages,                           // Correct total pages based on filtered or unfiltered records
    currentPage: page,
    validFields 
  };
};
