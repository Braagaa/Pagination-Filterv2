/*
Note: I have used closure as a way to keep reference of the current visible
      list of students in certain functions because it is very helpful for callbacks
	  to get access to this list when it changes.
*/
const studentsPerPage = 10;                   //you can alter the number of students per page with this constant

$.fn.extend({                                //Added four functionalities to jquery so chaining methods can flow better
	chain: function(func) {                  //chain recieves a func runs it with the current jquery value and returns the outcome of that function on the next stack of the jquery object
		return this.pushStack(func(this.get()));
	},
	tap: function(func) {                    //tap is used for running side effect functions and then returning the same jquery object back
		func(this.get());
		return this;
	},
	sort: function(func) {                   //sort is used to initially order the students list by alphabetical order based from their names
		return this.pushStack(this.get().sort(func));
	},
	if: function(pred, func) {               //if takes a boolean and a function. If boolean is true it runs the function with the the jquery object value as its argument. The same jquery object is sent back
		if (pred) {
			func(this.get());
		}
		return this;
	}
});

const divideCeil = (num, divisor) => Math.ceil(num / divisor);      //Divides 2 numbers and recieves the ceiling result
const paginationHTML = num => '<li><a>' + num + '</a></li>';        //Takes a number and outputs a HTML value represented as a string
const createButtons = (num, denom) => range(divideCeil(num, denom)) //Used to create the buttons on the screen
						                .map(paginationHTML);
const removeElements = selector => $(selector).remove();         //Removes elements which is used to remove the buttons from the screen
const getTextLowerCase = (element, selector) => $(element).find(selector).text().toLowerCase(); //Takes an element and a selector(string) to find a childs textcontent and returns it in lowercase

const sortByName = function(a, b) {//sorting algorithm for alphabetical ordering for the array.sort function
	a = getTextLowerCase(a, 'h3');
	b = getTextLowerCase(b, 'h3');
	if (a < b) {
		return -1;
	}
	if (a > b) {
		return 1;
	}
	return 0;
}

const preRange = function(array) {  //preRange is curried function used to create an array of ordered numbers from 1 to whatever number input it receives
	return function(num) {
		if (num === 0)
			return array;
		
		array[num - 1] = num;
	
		return preRange(array)(num - 1);
	}
}
const range = (num) => preRange([])(num);  //range initalizies the preRange function with a empty array and later only needs a second argument as a number to run preRange's inner function


										
const pagination = function(list) {
	return function(index, element) {
		const num = parseInt(element.textContent) * studentsPerPage;  //calculates the number needed to use for approriate students to show on the page based off the the number found in the textContent value of the hyperlink element
	
		return list.filter('.showMe')                     //takes the list jQuery object and filters the values if the elements contain the class showMe
				   .removeClass('showMe')                 //removes the class from the selected elements
			       .end()                                 //goes back to the previous value on the stack -> the full list
			       .slice(num - studentsPerPage, num)     //slices the correct elements needed to be displayed on the page
			       .addClass('showMe');                   //adds the showMe class to the sliced selected elements
	}	                                                  //jQuery object returned
}				   
						   
const pagesCallback = function(list) {   //changes pages on the screen
	return function() {
		return $(this).closest('ul')               //this (<a></a> element) is wrapped in a jQuery object and finds the closest ul parent
					  .find('.active')             //from the ul it finds the child element with the class active
				      .removeClass('active')       //remove the class active from the child
				      .end()                       //goes back to the previous value on the stack -> ul
				      .end()                       //goes back to the previous value on the stack -> a element
				      .addClass('active')          //adds the class active to the a element
				      .each(pagination(list));     //runs the pagination function with the list and the current a element as its arguments
	}                                              //returns jquery object
}

const filterStudentsBySearch = function(list) {
	const input = $('.student-search input').val().trim().toLowerCase();  //finds the input value, trims for whitespace and lowercases the value
	const email = /^[^@]+/g;                                              //regex to find a string match for anything before the @ sign
	
	return list.filter('.showMe')                                                                                //takes the list jQuery object and filters the students elements that have the showMe class
			   .removeClass('showMe')                                                                            //removes the class from those student elements
			   .end()                                                                                            //goes back to the previous value on the stack -> the starting list
			   .filter((index, element) => getTextLowerCase(element, 'h3').includes(input) ||                    //filters the list to find if the name or address of the students match the input value or passes the email regex test
										   getTextLowerCase(element, '.email').match(email)[0].includes(input))
			   .addClass('showMe')                                                                               //adds the showMe class to those students that pass the filtered test
			   .filter((index, element) => getTextLowerCase(element, 'h3').substring(0, input.length) === input) //further filters the list to find the students that match the input from the beginning of the name and not just anywhere in the name
			   .prependTo('.student-list')                                                                       //appends those students that were successfully filtered to the top of the list so that it would match what the user entered correctly
			   .end()                                                                                            //goes back to the previous value on the stack
			   .end();                                                                                           //goes back to the previous value on the stack
}                                                                                                                //returns jQuery object with the first filtered list students

const searchStudents = function() {
	const $filteredStudents = filterStudentsBySearch(students);   //filteres the approriate students needed to be displayed on the page
	
	return $filteredStudents.tap(() => removeElements('.noList'))                                                                //uses tap to run a function to remove the paragraph element with the noList class in it (the error message)
							.if($filteredStudents.length === 0, () => $('.page').append('<p class="noList">No Results :(</p>'))  //tests to see if the $filteredStudents jQuery object has a length of 0. If it does it runs the annonymous function to appened an HTML message to the .page element so the users can see the message
							.tap(() => removeElements('.pagination'))                                                            //uses tap to remove the elements with the .pagination class (the a elements)
							.chain((list) => createButtons(list.length, studentsPerPage))                                        //chain runs the annonymous function that uses the jQuery object's list value as its argument to create the correct number of buttons and returns the result into the jQuery's object current stack
							.tap((buttons) => appendButtons($filteredStudents, buttons))                                         //uses tap to append those buttons to the screen and give them an event handler
}

const appendButtons = function(list, buttons) {
	return $('.page').append('<div class="pagination"><ul></ul></div>')   //wraps the .page element into a jQuery object and appends the HTML to it
		             .find('.pagination ul')                              //finds the ul child
					 .append(buttons)                                     //appends the buttons to the ul (the page numbers)
					 .find('a')                                           //finds the a element children
					 .first()                                             //gets the first a element from the children
					 .addClass('active')                                  //adds the active class to the first a element
					 .each(pagination(list))                              //runs the curried pagination function with list as its first argument and the current element with its second (the first a element)
					 .end()                                               //goes back to the previous value on the stack -> all of the a elements
					 .on('click', pagesCallback(list));                   //gives all the a elements a click event handler
}
						   
//Program
const students = $('.student-item').sort(sortByName)            //gets the initial list of students and sorts them by alphabetical order (name)
								   .appendTo('.student-list')   //appends them to the .student-list element based off of the sorted list result
								   .addClass('hideMe');         //gives all the student elements the hideMe class to hide them

$('.page-header').append('<div class="student-search"></div>')            //Adding the search bar dynamically
				 .children('.student-search')
				 .append('<input placeholder="Search for students...">')
				 .append('<button>Search</button>')
				 .children('button')
				 .on('click', searchStudents);                            //gives the search button a click event handler
								   
appendButtons(students, createButtons(students.length, studentsPerPage));   //creates the approriate number of buttons and sends them and the student list to be appended and used in the appendButtons function