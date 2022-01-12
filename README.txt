Lucas Colwell #101102212

to run:

ensure proper directory
run npm install
open new cmd terminal
run mongod --dbpath=INSERTLOCATIONHERE. I provided a db folder for your convenience, although it is empty, it is just for your convenience. It does not contain any files
run node database-initializer.js (I modified this file, you will need to run my specific version. Other versions won't work)
run npm start
navigate to localhost:3000 in the web browser of your choice (I used chrome when designing this)
test all functionality. This is straightforward. 

Design choices:
If you try and log into a page which would be redundant (logging in when logged in, logging out when logged out, trying to access orders when not logged in, trying to register when logged in), the server will force
direct you to a rendered version of the home page. I confirmed this approach with the TA.

I included an array on the user object called orders. It is an array of order objects, and is populated once the server receives an order for a specific user.

I show all order information on the profile, AND on the specific order page. This is because I wanted to see all information, and ensure everything was correct.

I used the profs session log in code (though obviously changed) and I cited this (much of the code has changed)

In order to never store ANYTHING from the server on RAM, I call mongo queries quite a bit. This is to adhere to the assignment requirements.

My views folder has all my pug files, which were used in place of standard html files.

I made one additional client-side js file, called userlist, which just handles specifying the users page. I could have made it with a form that uses post as well, but I decided to use clientside JS as I wanted to
experiment a little. It still works exactly as it should and follows the assignment guidelines.

Apart from this, the code is commented and should clearly show what each function does.

