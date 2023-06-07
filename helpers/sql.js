const { BadRequestError } = require("../expressError");

/** Create string fragments for UPDATE queries for SET & VALUES data
 *
 * Accepts partial or complete data for any instance ( Users || Companies || Jobs )
 *
 * ----- EXAMPLE -----
 * To update USER data:
 * {dataToUpdate} = {firstName: 'user', lastName: 'one'}
 *
 * SQL Columns to Update:
 * {jsToSql} = {firstName: 'first_name', lastName: 'last_name'}
 *
 * Throws'BadRequestError' if dataToUpdate not found.
 *
 * Maps dataToUpdate keys w/ query placeholders (`= $1`, `= $2`, `= $3`, etc.)
 * Joins 'cols' to create a formated query fragment for SET data
 * >>> setCols = `first_name = $1, last_name = $2`
 *
 * Creates an array of values associated with placeholders in SET data
 * >>> values = ['user', 'one']
 *
 * Returns { setCols, values }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Create a WHERE string & VALUES arr for SELECT query data
 *
 * Accepts params that includes {filter: value} pairs to filter companies
 *
 * Creates WHERE statement strings & returns 'BadRequestError' if invalid 'filter' (aka Company column)
 *
 * Creates array of values matching filter keys
 *
 * Returns {whereCols: <a single where statement>, values: <values arr>}
 *
 * */

function sqlForCompanyFilter(params) {
  // Get filters from params' keys
  const keys = Object.keys(params);

  // Push individual conditional statements to 'whereConditionals'
  const whereConditionals = [];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === "comp_name") {
      whereConditionals.push(`"${keys[i]}" ILIKE $${i + 1}`);
    } else if (keys[i] === "minEmployees") {
      whereConditionals.push(`"num_employees" >= $${i + 1}`);
    } else if (keys[i] === "maxEmployees") {
      whereConditionals.push(`"num_employees" <= $${i + 1}`);
    } else throw new BadRequestError(`Invalid filter: ${keys[i]}`);
  }

  // Map filter values from keys
  const values = [];
  for (let k in keys) {
    if (keys[k] === "comp_name") {
      values.push(`%${params[keys[k]]}%`);
    } else {
      values.push(params[keys[k]]);
    }
  }

  // Return WHERE params for SELECT query and associated VALUES
  return {
    whereCols: whereConditionals.join(" AND "),
    values: values,
  };
}

module.exports = { sqlForPartialUpdate, sqlForCompanyFilter };
