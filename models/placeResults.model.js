module.exports = function(attributionHtml, nextPageToken, places) {
    let placesArray = places;
    
    if (!places) {
        placesArray = [];
    } else {
        if (!places[0]) {
            placesArray = [places];
        }
    }
    
    return {
        attributionHtml,
        nextPageToken,
        places: placesArray
    };
};