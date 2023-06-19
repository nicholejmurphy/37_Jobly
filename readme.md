# Jobly Backend

This is the Express backend for Jobly, version 2.

To run this:

    node server.js
    
To run the tests:

    jest -i

## Live Code review Questions:
- Thoughts on middleware ensureCurrUserOrAdmin. Is there a better way to use these?
- authenticateJWT - purpose of "Bearer" - check into syntax of '/^[Bb]earer /'
  