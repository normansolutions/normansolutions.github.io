var listofgigstocome = document.querySelectorAll("ul>li.ns-notpassed");
var nextgig = listofgigstocome[listofgigstocome.length - 1];
nextgig.classList.add("ns-nextgig");

window.addEventListener("load", function () {
  quicklink({
    origins: !0,
    priority: !0
  });
});
