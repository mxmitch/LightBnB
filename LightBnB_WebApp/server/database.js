/* eslint-disable camelcase */
const db = require('../db/index.js');

/// Users

const getUserWithEmail = function(email) {
  return db.query(`
  SELECT * FROM users
  WHERE email LIKE $1
  `, [email])
    .then(res => res.rows[0]);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 */
const getUserWithId = function(id) {
  return db.query(`
  SELECT * FROM users
  WHERE id LIKE $1
  `, [id])
    .then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 */
const addUser = function(user) {
  const {
    name,
    email,
    password
  } = user;
  return db.query(`
  INSERT INTO users (name,email,password)
  VALUES ($1,$2,$3)
  RETURNING *;
  `, [name, email, password])
    .then(res => res.rows[0]);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const guest = guest_id;
  const propertyLimit = limit;
  return db.query(`
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `, [guest, propertyLimit])
    .then(res => res.rows);
};
exports.getAllReservations = getAllReservations;

/// Properties

const getAllProperties = function(options, limit = 10) {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (queryParams.length - 1 !== 0) {
      queryString += `AND city LIKE $${queryParams.length}`;
    } else {
      queryString += `WHERE city LIKE $${queryParams.length}`;
    }
  }

  if (options.owner_id) {
    queryParams.push(Number(options.owner_id));
    console.log(queryParams.length);
    if (queryParams.length - 1 !== 0) {
      queryString += `AND owner_id = $${queryParams.length}`;
    } else {
      queryString += `WHERE owner_id = $${queryParams.length}`;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night * 100));
    queryParams.push(Number(options.maximum_price_per_night * 100));
    if (queryParams.length - 2 !== 0) {
      queryString += `AND cost_per_night <= 
      $${queryParams.length} AND cost_per_night >= $${queryParams.length - 1}`;
    } else {
      queryString += `WHERE cost_per_night <= $${
        queryParams.length
      } AND cost_per_night >= $${queryParams.length - 1} `;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    if (queryParams.length - 3 !== 0) {
      queryString += `AND rating >= $${queryParams.length}`;
    } else {
      queryString += `WHERE rating >= $${queryParams.length}`;
    }
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return db.query(queryString, queryParams)
    .then(res => res.rows);
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 */
const addProperty = function(property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;
  return db.query(`
  INSERT INTO properties (owner_id,title,description,thumbnail_photo_url,cover_photo_url,cost_per_night,street,city,province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING *;
  `, [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms])
    .then(res => res.rows);
};
exports.addProperty = addProperty;