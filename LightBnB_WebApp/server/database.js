const {
  Pool
} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// const properties = require('./json/properties.json');
// const users = require('./json/users.json');

/// Users

const getUserWithEmail = function(email) {
  return pool.query(`
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
  return pool.query(`
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
  return pool.query(`
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
  return pool.query(`
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
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (queryParams.length - 1 !== 0) {
      queryString += `AND city LIKE $${queryParams.length}`;
    } else {
      queryString += `WHERE city LIKE $${queryParams.length}`;
    }
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    if (queryParams.length - 1 !== 0) {
      queryString += `AND owner_id LIKE $${queryParams.length}`;
    } else {
      queryString += `WHERE owner_id LIKE $${queryParams.length}`;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryParams.push(options.maximum_price_per_night * 100);
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
    queryParams.push(options.minimum_rating);
    if (queryParams.length - 3 !== 0) {
      queryString += `AND rating >= $${queryParams.length}`;
    } else {
      queryString += `WHERE rating >= $${queryParams.length}`;
    }
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
    .then(res => res.rows);
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;