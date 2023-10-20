// let's say this is the API function with two callbacks,
// one for success and the other for error
function apiFunction(query, successCallback, errorCallback) {
    if (query == "bad query") {
            errorCallback("problem with the query");
                }
                    successCallback("Your query was <" + query + ">");
                    }
                    
                    // myFunction wraps the above API call into a Promise
                    // and handles the callbacks with resolve and reject
                    function apiFunctionWrapper(query) {
                        return new Promise((resolve, reject) => {
                                apiFunction(query,(successResponse) => {
                                            resolve(successResponse);
                                                    }, (errorResponse) => {
                                                                reject(errorResponse)
                                                                        });
                                                                            });
                                                                            }
                                                                            
                                                                            // now you can use await to get the result from the wrapped api function
                                                                            // and you can use standard try-catch to handle the errors
                                                                            async function businessLogic() {
                                                                                try {
                                                                                        const result = await apiFunctionWrapper("query all users");
                                                                                                console.log(result);
                                                                                                
                                                                                                        // the next line will fail
                                                                                                                const result2 = await apiFunctionWrapper("bad query");
                                                                                                                    } catch(error) {
                                                                                                                            console.error("ERROR:" + error);
                                                                                                                                }
                                                                                                                                }
                                                                                                                                
                                                                                                                                // call the main function
                                                                                                                                businessLogic();