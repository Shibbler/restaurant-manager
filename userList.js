let userlist =[]

function init(){
    /*console.log("IT WORKS")
    let req = new XMLHttpRequest();
    //read JSON data and update page accordingly.
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
            userlist= JSON.parse(this.responseText)
            console.log(userlist);
        }
	}
    console.log(searchCondition);
	//Send a POST request to refine data
	req.open("GET", `/users`);
    req.setRequestHeader("Content-Type", "application/json")
	req.send();
    console.log("sent to server")*/
    //this was a different way of getting data, but it didn't use mongo as well
}
//function to handle search button click
function search(){
    //console.log("IT searches")
    let req = new XMLHttpRequest();
    //read html data and update page accordingly.
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
            console.log(this.response)
            document.body.innerHTML=this.response;
        }
	}
    searchCondition = document.getElementById("searchCondition").value
    console.log(searchCondition);
	//Send a get request for new data so we can access the db
	req.open("GET", `/userSearch/${searchCondition}`);
    req.setRequestHeader("Content-Type", "text/html")
	req.send();
    //console.log("search sent to server")
}