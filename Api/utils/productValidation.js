function productPostValidation(name,description,sku,manufacturer,quantity){
    if(!name || !description || !sku || !manufacturer || !quantity || quantity<=0) return false;
    else return true;
    
}

module.exports = productPostValidation;