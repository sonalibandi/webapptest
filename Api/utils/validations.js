function validInputsForUpdate(userId, password, first_name, last_name) {
    if (userId==="" || !password || !first_name || !last_name) return false;
    return true;
  }
  
  function validInputsForCreate(username, password, first_name, last_name) {
    if (!username || !password || !first_name || !last_name) return false;
    else if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(username))
    return true;
    else
    return false;
  }
  
  module.exports = {
    validInputsForCreate,
    validInputsForUpdate,
  };