var mainpage = $('#main-page');
var map = $('#map_gc');
createList();

function createList(){
    // if($('#level')){
    //     mainpage.remove($('#level'));
    // }
    // Create div element to store list
    var divider = $("<div id='levelList' class='level'></div>");

    //Create button to toggle
    // var button = $("<button class='mdc-button--raised button-title'></button>");
    // var buttonSpan = $("<span class='mdc-button__label'></span>").text("Select Level");
    // button.append(buttonSpan);

    // Create List Element
    var list = $("<ul class='mdc-list mdc-list--two-line levelUnordered'></ul>");
    addListElements(list, 10)
    // divider.append(button);
    divider.append(list);
    mainpage.append(divider);

    // Make the DIV element draggable:
    dragElement(document.getElementById("levelList"));  

    $(document).click(function() {
        //do something
        divider.remove();
    });
}

function addListElements(mainList, number){
    // var label = $("<li class='mdc-list-item levelTitle'></li>");
    // var labelSpan = $("<span class='mdc-list-item__text'></span>").text("Select Level to View");
    // label.append(labelSpan);
    // mainList.append(label);

    var index;
    for (index = 0; index < number; index++) { 
        // Create List element
        var listElement = $("<li class='mdc-list-item'></li>");

        // Handle onclick event for list element here
        setOnclickEvent(listElement);

        // Create span element with 2 span child for double lined lists
        var parentSpan = $("<span class='mdc-list-item__text'></span>");
        var spanFirstLine = $("<span class='mdc-list-item__primary-text primaryText'></span>").text("Level "+ (index+1));
        var spanSecondLine = $("<span class='mdc-list-item__secondary-text secondaryText'></span>").text("Description ");

        // Create separator for the lists
        var separator = $("<li  role='separator' class='mdc-list-divider'></li>");

        // Append span elements together and to the list element
        parentSpan.append(spanFirstLine);
        parentSpan.append(spanSecondLine);
        listElement.append(parentSpan);

        // Append to the main ul and add separator
        mainList.append(listElement);
        mainList.append(separator);
    }
}

function setOnclickEvent(listElement){

    // Handle onclick event for list element here
    var isDragging = false;
    listElement
    .click(function(ev) {
        // Prevent click event from propagating and closing itself
        ev.stopPropagation(); 
    })
    .mousedown(function(ev) {
        $(window).mousemove(function() {
             // If mouse moved, the element is being dragged
            isDragging = true;
            $(window).off("mousemove");
        });
    })
    .mouseup(function(ev) {
        var wasDragging = isDragging;
        isDragging = false;
        $(window).off("mousemove");
        if (!wasDragging) {
            // if mouse wasnt moved, then we allow click to happen
            alert( "Handler for .click() called." ); 
        }
    });
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV: 
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}