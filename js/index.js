var w = 1170;
var h = 450;
var padLeft = 70;
var padRight = 12;
var padBottom = 120;
var padTop = 20;

// colorbrewer colors: http://colorbrewer2.org/
// 10 colors
var colorbrewer = ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"].reverse();


var monthFormat = d3.timeFormat("%B"); //format to months
// note: d3 version3 uses d3.time.format

var tooltip = d3.select("#heatmap")
                .append("div")
                .attr("id", "tooltip")
                .style("opacity", 0.0);

var svg = d3.select("#heatmap")
            .append("svg")
            .attr("width", w + padLeft + padRight)
            .attr("height", h + padBottom + padTop);

// depending on the D3 version we load
// D3 V4: d3.json("url", function(error, data) { ... })
// D3 V5: d3.json("url").then(function(data) { ... })   .catch(function(error) { ... })
// https://stackoverflow.com/questions/49768165/code-within-d3-json-callback-is-not-executed

d3.json("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json").then(function (data) {


  var subtitle = d3.select("#description")
                   .html("Year " + data.monthlyVariance[0].year + " till " + data.monthlyVariance[data.monthlyVariance.length - 1].year + " - Base Temperature: " + data.baseTemperature + "&#8451;");


  var yearsRange = data.monthlyVariance.map(function (item) {
    return item.year;
  });

  var monthRange = data.monthlyVariance.map(function (item) {
    return new Date(item.year, item.month - 1);
  });


  // about ordinal scales, rangeBands, rangeRoundBands
  // https://d3-wiki.readthedocs.io/zh_CN/master/Ordinal-Scales/#ordinal_range

  // d3 v5.0 changes:
  // https://github.com/d3/d3/blob/master/CHANGES.md#scales-d3-scale

  // x-axis
  var xScale = d3.scaleBand() // center the tick to the bar
                 .domain(yearsRange)
                 .range([padLeft, w + padLeft]);

  var xAxis = d3.axisBottom(xScale)
                .tickSizeOuter(0) // remove end tick
                .tickValues(xScale.domain().filter(function (year) {
    //set ticks to years divisible by 20
                  return year % 20 === 0;
                }));


  svg.append("g")
     .attr("transform", "translate(0," + (h + padTop) + ")")
     .attr("id", "x-axis")
     .call(xAxis)
     .append("text")
     .text("Year")
     .attr("fill", "navy")
     .style("font-size", 15)
     .style("text-anchor", "middle")
     .attr("transform", "translate(" + (w / 2 + padLeft) + "," + 35 + ")");


  //d3 v3.x and v5 changes
  //  https://github.com/d3/d3/blob/master/CHANGES.md

  // y-axis
  //  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reverse(); //to display Jan at top and Dec at bottom of y-axis

  var yScale = d3.scaleBand() // d3 v3/v4 using scale.ordinal()/scaleOrdinal()
  // center the tick to the bar
                 .domain(months)
                 .range([h + padTop, padTop]);

  var yAxis = d3.axisLeft(yScale)
                .tickSizeOuter(0) // remove end tick
  //                .ticks(12)
  //                .tickFormat(monthFormat);
                .tickFormat(function (month) {
                  var date = new Date(0);
                  date.setMonth(month - 1);
                  return monthFormat(date);
                });

  svg.append("g")
     .attr("transform", "translate(" + padLeft + "," + 0 + ")")
     .attr("id", "y-axis")
     .call(yAxis)
     .append("text")
     .text("Month")
     .attr("fill", "navy")
     .style("font-size", 15)
     .style("text-anchor", "middle")
     .attr("transform", "translate(" + (20 - padLeft) + "," + h / 2 + ")" + "rotate(-90)"); // adjust x-axis label position here


  // legend
  // https://d3-legend.susielu.com/
  // ** must load cdn in script!!!


  // Quantile Scale Legend
  var minTemp = d3.min(data.monthlyVariance, function (d) {return d.variance + data.baseTemperature;});
  var maxTemp = d3.max(data.monthlyVariance, function (d) {return d.variance + data.baseTemperature;});


  var quantize = d3.scaleQuantize()
                   .domain([minTemp, maxTemp])
                   .range(colorbrewer);

  var legend = d3.legendColor()
                 .labelFormat(d3.format(".2f")) // decimal format. .2f is 2 decimal places
                 .title("Legend (Temp ℃)")
                 .titleWidth(100)
                 .shapeWidth(70)
                 .orient("horizontal")
                 .scale(quantize);

  svg.append("g")
     .attr("id", "legend")
     .attr("transform", "translate(0" + padLeft + ", " + (h + padTop + padBottom - 55) + ")")
     .call(legend);



  // heat map
  svg.append("g")
     .selectAll("rect")
     .data(data.monthlyVariance)
     .enter()
     .append("rect")
     .attr("data-month", function (d) {return d.month - 1;}) // to fulfil data-month test
     .attr("data-year", function (d) {return d.year;})
     .attr("data-temp", function (d) {return data.baseTemperature - d.variance;})
     .attr("x", function (d) {return xScale(d.year);})
     .attr("y", function (d) {return yScale(d.month);})
     .attr("width", w / (d3.max(yearsRange) - d3.min(yearsRange) + 1))
     .attr("height", h / 12)
     .attr("fill", function (d, i) {
       var integer = Math.floor((d.variance + data.baseTemperature - minTemp) / (maxTemp - minTemp) * 10);
       if (integer != 10) {
         return colorbrewer[integer];
       } else
       {// 1780 Apr the resulting integer will return 10
         return colorbrewer[integer - 1]; // since colorbrewer index is 0-9, we added this statement to keep the fill within the colorbrewer. if not the bar will be black color
       }
     })
     .attr("opacity", 1)
     .attr("class", "cell")
     .on("mouseover", function (d, i) {
       tooltip.transition()
              .duration(300)
              .style("opacity", 0.8);
    //      tooltip.html(d.year + " - " + d.month + "<br/>" + (data.baseTemperature + d.variance).toFixed(3) + "<br/>" + d.variance)
       tooltip.html(d.year + " - " + monthFormat(new Date(0).setMonth(d.month - 1)) + "<br/>" + "Temp: " + (data.baseTemperature + d.variance).toFixed(2) + "&#8451;" + "<br/>" + "Var: " + d.variance.toFixed(2) + "&#8451;")
              .attr("data-year", d.year)
              .style("left", xScale(d.year) + "px")
              .style("top", yScale(d.month) - 10 + "px");
      })
     .on("mouseout", function (d) {
       tooltip.transition()
              .duration(300)
              .style("opacity", 0);
      });


    }, function (error) {
  console.log("Error loading data from server.");
});
