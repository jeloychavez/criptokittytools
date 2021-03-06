var owner

const node = document.getElementById("ownerInput");
node.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
      owner = node.value
      getAllCats()
    }
});

var user
var kittyContract
var kittyAddress = '0x06012c8cf97bead5deae237070f9587f8e7a266d'
var saleClockAuctionAddress = '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C'

function applyFilters() {
  let sellingFilterValue = document.querySelector('input[name="sellingFilter"]:checked').value;
  if (sellingFilterValue == 'sellingAll') {
    delete filters['selling']
  } else {
    if (sellingFilterValue == 'sellingTrue') {
      filters['selling'] = 'true'
    } else {
      filters['selling'] = 'false'
    }
  }
  getAllCats()
}

var filters = {}

function getFilters() {
  if (getReqParam('kittyId')) {
    filters['kittyId'] = getReqParam('kittyId')
  }
  if (getReqParam('selling')) {
    filters['selling'] = getReqParam('selling')
    if (getReqParam('selling') === 'true') {
      document.getElementById("sellingTrue").checked = true
    } else {
      document.getElementById("sellingFalse").checked = true
    }
  }
}

function checkPaymentScreen(owner, res) {
  console.log(owner)
  console.log(res)


  if (res.error) {
    c.header(`Error occured`)
  } else {
    if (res.queue == 0) {
      ownerCatsCount = kittytoolbox.getKittiesCount(owner)
      c.header(`Your portfolio wasn't yet processed or included into DB`)
      c.header(`You have: ` + ownerCatsCount + ` kitties`)

      let elem = document.createElement('p')
      elem.innerHTML = `<span style="font-size: 25px">To prevent high network load and DoS we only process portfolios below ${kittytoolbox.freeCatsLimit} kittens for free.</span>`
      c.elem(elem)

      if (ownerCatsCount<=kittytoolbox.freeCatsLimit) {
        let elem = document.createElement('p')
        elem.innerHTML = `<span style="font-size: 25px">You can queue processing by pressing the button: </span> <button style="height: 30px; vertical-align:top" onclick="queueProcessing('${owner}')">Queue processing</button>`
        c.elem(elem)
      } else {

        var perHundredCats = 0.02
        var donation = (ownerCatsCount/100 * perHundredCats).toFixed(3)
        if (donation<0.01) {donation = 0.01}

        let elem = document.createElement('p')
        elem.innerHTML = `<div id="donationInfo"><span style="font-size: 25px">Suggested donation for processing ${ownerCatsCount} cats is:</span> &nbsp;&nbsp; <span style="font-size:30px">${donation} ETH</span> &nbsp&nbsp <button style="height: 25px; vertical-align: text-bottom" id="donateButton" onclick="donate(${donation})">Pay with MetaMask</button><img src="ajax-loader.gif" style="display:none; height:25px; vertical-align: text-bottom" id="donationLoader">`+
        `<p><span style="font-size: 25px">Your portfolio will be queued for processing after the donation transaction is approved by the network.</span></p></div><br><br>`+
        c.elem(elem)
        c.log(`* In unpredictable situations (like if CryptoKitty API becomes restricted, Server IP banned, CK site down, etc) if there will be no possibility to retreive cats information - `)
        c.log(`the gas fee to process refunds will be substracted from donation amount`)
      }
    }
    if (res.queue == -1) {
      c.header(`Your portfolio is currently processing... Check back soon`)
    }
    if (res.queue > 0) {
      c.header(`Your portfolio processing is queued. Your place in queue: ${res.queue}`)
    }
  }

}

function donate(donation) {
  let donationAddress = `0x1CC506b64bcB8CC1FE722f05b197c0c52688236F`;
  let button = document.getElementById("donateButton")
  button.style.display = "none"
  let loader = document.getElementById("donationLoader")
  loader.style.display = "inline-block"

  web3.eth.sendTransaction({
		to: donationAddress,
		value: web3.toWei(donation),
		gas: '21000',
	}, (error, result) => {
		donateFinish(error, result)
	});
}

function queueProcessing(owner) {
  console.log(`Queueing ${owner}`)
  response = kittytoolbox.queuePortfolio(owner)
  c.header(response.text)
}

function donateFinish(error, tx) {
  let loader = document.getElementById("donationLoader")
  loader.style.display = "none"

  donationDiv = document.getElementById("donationInfo")
  let elem = document.createElement('p')

  if (error) {
    elem.appendChild(document.createTextNode(error))
    let button = document.getElementById("donateButton")
    button.style.display = "inline-block"
    elem.style.color="red"
  } else {
    elem.innerHTML(`<p>Thank you for your donation. Your portfolio will be queued as soon as the transaction is approved: <a href="https://etherscan.io/tx/${tx}">${tx}</a></p><p>Check back later</>`)
    elem.style.color="green"
  }
  donationDiv.appendChild(elem)
}

function init() {

  try {
    updateMetamaskAddress();
    web3.eth.getBalance(user, (error, response) => updateMetamaskBalance(response))
    kittyContract = web3.eth.contract(kittyAbi).at(kittyAddress);
    saleContract = web3.eth.contract(saleClockAuctionAbi).at(saleClockAuctionAddress);
  } catch(err) {
    console.log(err)
  }


  getFilters()

  if (getReqParam('owner')) {
    const node = document.getElementById("ownerInput");
    owner = getReqParam('owner').toLowerCase()
    node.value = owner
    setTimeout(getAllCats, 1000)
  } else {
    if (user) {
      const node = document.getElementById("ownerInput");
      owner = user.toLowerCase()
      node.value = owner
      setTimeout(() => getAllCats(owner), 1000)
    }
  }

}

function useMetamask() {
  user = web3.eth.accounts[0];
  const node = document.getElementById("ownerInput")
  node.value = user
  owner = user.toLowerCase()
  getAllCats(owner)
}

function replaceElement(obj, str, newObj) {
  ObjParent=obj.parentNode;
  if (newObj) {
    ObjParent.replaceChild(newObj, obj);
    if (str) {
      var tmpObj=document.createElement("span");
      tmpObj.innerHTML=str;
      ObjParent.appendChild(tmpObj);
    }
  } else {
    if(obj.outerHTML) { //if outerHTML is supported
      obj.outerHTML=str; ///it's simple replacement of whole element with contents of str var
    }
  }
}

function sell(kittyId) {
  let loader = `<div id='loader${kittyId}' style="width: 100%; height: 100px; display: inline; "><span style="display: inline-block; height: 100%; vertical-align: middle"></span><img src="ajax-loader.gif" style="margin-left: 150px; vertical-align: middle"></div>`
  obj = document.getElementById("sell"+kittyId)
  replaceElement(obj, loader)

  saleContract.getCurrentPrice(kittyId, (error,response) => checkCatForSale(kittyId, response, error))
}

function cancel(kittyId) {
  let loader = `<div id='cancelLoader${kittyId}' style="width: 100%; height: 100px; display: inline; "><span style="display: inline-block; height: 100%; vertical-align: middle"></span><img src="ajax-loader.gif" style="margin-left: 150px; vertical-align: middle"></div>`
  obj = document.getElementById("cancel"+kittyId)
  replaceElement(obj, loader)

  updatePrice(kittyId, (response)=>doCancel(kittyId, response))
}

function doCancel(kittyId, price) {
  let gasPrice = document.getElementById("defaultGasInput").value
  if (price) {
    saleContract.cancelAuction(kittyId, {gasPrice: web3.toWei(gasPrice, "gwei")}, (error,response) => {finishCancel(kittyId, error, response)})
  } else {
    obj = document.getElementById("cancelLoader"+kittyId)
    replaceElement(obj, '')
  }
}

function finishCancel(kittyId, error, tx) {
  obj = document.getElementById("cancelLoader"+kittyId)
  if (error) {
    replaceElement(obj, `<br><p style="color:red;  display: inline-block">Error sending tx: ${error}</b></p>`, renderCancelButton(kittyId))
  } else {
    replaceElement(obj, `<p style="color:green; display: inline-block"><b>Cancel tx sent: <a href="https://etherscan.io/tx/${tx}">${tx}</a></b></p>`, renderCancelButton(kittyId))
  }
}

function buy(kittyId) {
  let loader2 = `<div id='buyLoader${kittyId}' style="width: 200px; height: 40px; display: inline-block; text-align: center"><span style="display: inline-block; height: 100%; vertical-align: middle"></span><img src="ajax-loader.gif" style="margin-left: auto; margin-right: auto; vertical-align: middle"></div>`
  obj = document.getElementById("buy"+kittyId)
  replaceElement(obj, loader2)

  updatePrice(kittyId, (response)=>getAuction(kittyId, response))
}

function getAuction(kittyId, price) {
  if (price) {
    saleContract.getAuction(kittyId, (error,response) => {processAuction(kittyId, response, price)})
  } else {
    obj = document.getElementById("buyLoader"+kittyId)
    replaceElement(obj, '')
  }
}


function processAuction(kittyId, response, price) {
  if (response[1].toNumber() > 0) {
    let gasPrice = document.getElementById("defaultGasInput").value
    let startingPrice = response[1]
    let endingPrice = response[2]
    let duration = response[3]
    if (startingPrice.lessThanOrEqualTo(endingPrice)) {
      saleContract.bid(kittyId, {value: price, gasPrice: web3.toWei(gasPrice, "gwei")}, (error, response)=>finishBuy(kittyId, error, response))
    } else {
      let difference = endingPrice.minus(startingPrice)
      let margin = difference.dividedToIntegerBy(duration / (3600))
      saleContract.bid(kittyId, {value: price.plus(margin), gasPrice: web3.toWei(gasPrice, "gwei")}, (error, response)=>finishBuy(kittyId, error, response))
    }
  }
}

function finishBuy(kittyId, error, tx) {
  obj = document.getElementById("buyLoader"+kittyId)
  if (error) {
    replaceElement(obj, `<br><p style="color:red;  display: inline-block">Error sending tx: ${error}</b></p>`, renderBuyButton(kittyId))
  } else {
    replaceElement(obj, `<p style="color:green; display: inline-block"><b>Sale tx sent: <a href="https://etherscan.io/tx/${tx}">${tx}</a></b></p>`, renderBuyButton(kittyId))
  }
}

function updatePrice(kittyId, callback) {
  let loader = `<div id='loader${kittyId}' style="width: 200px; height: 40px; display: inline-block; text-align: center"><span style="display: inline-block; height: 100%; vertical-align: middle"></span><img src="ajax-loader.gif" style="margin-left: auto; margin-right: auto; vertical-align: middle"></div>`
  obj = document.getElementById("priceOf"+kittyId)
  replaceElement(obj, loader)

  saleContract.getCurrentPrice(kittyId, (error,response) => updatePriceFinish(kittyId, response, error, callback))
}

function updatePriceFinish(kittyId, price, error, callback) {
  if (!error) {
    if (price.toNumber() > 0) {
      obj = document.getElementById("loader"+kittyId)
      replaceElement(obj, null, renderSalePrice(web3.fromWei(price).toFixed(3), kittyId))
      if (callback) callback(price)
    } else {
      obj = document.getElementById("loader"+kittyId)
      replaceElement(obj, `<p style="color:red; display: inline-block"><b>The cat is no longer on sale</b></p>`)
      if (callback) callback(null)
    }
  }
}

function renderSalePrice(price, kittyId) {
  link = document.createElement('a')
  link.id = "priceOf"+kittyId
  link.style.display = "inline-block"
  link.style.color = "red"
  link.href = ('https://www.cryptokitties.co/kitty/'+kittyId)

  para0 = document.createElement('h2')
  text0 = document.createTextNode('SELLING AT: ' + price)

  para0.appendChild(text0)
  link.appendChild(para0)

  return link
}

function renderBuyButton(kittyId) {
  buyButton = document.createElement('button')
  buyButton.innerHTML = 'Buy'
  buyButton.style.width = '100px'
  buyButton.style.height = '30px'
  buyButton.style['margin-left'] = '20px'
  buyButton.addEventListener('click',() => {buy(kittyId)}, false)
  buyButton.id = 'buy'+kittyId

  return buyButton
}

function renderCancelButton(kittyId) {
  cancelButton = document.createElement('button')
  cancelButton.innerHTML = 'Cancel Sale'
  cancelButton.style.width = '100px'
  cancelButton.style.height = '30px'
  cancelButton.style['margin-left'] = '20px'
  cancelButton.addEventListener('click',() => {cancel(kittyId)}, false)
  cancelButton.id = 'cancel'+kittyId

  return cancelButton
}

function checkCatForSale(kittyId, response, error) {
  if (!error) {
    if (response.toNumber() > 0) {
      obj = document.getElementById("loader"+kittyId)
      replaceElement(obj, `<p style="color:red"><b>The cat is already on sale for: ${web3.fromWei(response).toFixed(3)}</b></p>`)
    } else {
      obj = document.getElementById("loader"+kittyId)
      replaceElement(obj, saleForm(kittyId))
    }
  }
}

function saleForm(kittyId) {
  var defaultGas = document.getElementById("defaultGasInput").value
  var defaultHours = document.getElementById("defaultSaleHoursInput").value
  var defaultPriceFrom = document.getElementById("defaultSaleStartInput").value
  var defaultPriceTo = document.getElementById("defaultSaleEndInput").value

  var str = ""
  str += `<div id="saleForm${kittyId}">`
  str += `Price: <input id="priceFrom${kittyId}" value="${defaultPriceFrom}" style="width:6em"> ➜ <input id="priceTo${kittyId}" value="${defaultPriceTo}" style="width:6em"> ETH<br/><br/>`
  str += `Duration (hours): <input id="duration${kittyId}" value="${defaultHours}" style="width:6em"><button id="confirmSell${kittyId}" onclick="confirmSell(${kittyId})">SELL</button></div>`
  return str
}

function confirmSell(kittyId) {
  let loader = `<div id='sellLoader${kittyId}' style="width: 100%; height: 100px; display: inline; "><span style="display: inline-block; height: 100%; vertical-align: middle"></span><img src="ajax-loader.gif" style="margin-left: 150px; vertical-align: middle"></div>`
  obj = document.getElementById("confirmSell"+kittyId)
  replaceElement(obj, loader)

  let priceFrom = document.getElementById("priceFrom"+kittyId).value
  let priceTo = document.getElementById("priceTo"+kittyId).value
  let duration = document.getElementById("duration"+kittyId).value

  //var confirmation = `You're selling ${kittyId} for ${web3.fromWei(web3.toWei(priceFrom))} -> ${web3.fromWei(web3.toWei(priceTo))}ETH during ${(Math.floor(duration*60*60)/3600).toFixed(0)} hours`

  //if (confirm(confirmation) == true) {
    sellTransaction(kittyId, priceFrom, priceTo, duration)
  //}
}

function sellTransaction(kittyId, priceFrom, priceTo, duration) {
  let gasPrice = document.getElementById("defaultGasInput").value
  kittyContract.createSaleAuction(kittyId, web3.toWei(priceFrom), web3.toWei(priceTo), Math.floor(duration*60*60), {gasPrice: web3.toWei(gasPrice, "gwei")}, (error, response) => sellTransactionFinished(error, response, kittyId))
}

function sellTransactionFinished(error, tx, kittyId) {
  obj = document.getElementById("saleForm"+kittyId)
  if (error) {
    replaceElement(obj, `<br><p style="color:red">Error sending tx: ${error}</b></p>`, obj)
    let sellLoader = document.getElementById("sellLoader"+kittyId)
    replaceElement(sellLoader, `<button id="confirmSell${kittyId}" onclick="confirmSell(${kittyId})">SELL</button>`)
  } else {
    replaceElement(obj, `<p style="color:green"><b>Sale tx sent: <a href="https://etherscan.io/tx/${tx}">${tx}</a></b></p>`)
  }
}

function getReqParam(name){
   if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}

function ownersCats() {
  if (typeof web3 !== 'undefined') {
    return (owner.toLowerCase() == user.toLowerCase())
  } else {
    return false
  }
}

var allCats = []


function getAllCats() {
  c.cls()
  owner = document.getElementById("ownerInput").value.trim().toLowerCase();
  showLoading()

  filtersStr = ""
  if (Object.keys(filters).length>0) filtersStr = "&"
  Object.keys(filters).forEach((key) => {
    filtersStr += `${key}=${filters[key]}`
  })
  history.pushState({"owner": owner}, "Portfolio of "+owner, "/cryptokittytools/portfolio.html?owner="+owner+filtersStr);
  setTimeout(()=>{getPortfolio(owner, hideLoading)}, 100)
}

function hideLoading() {
  document.getElementById("loader").style = "width: 100%; height: 100px; display: none;";
}

function showLoading() {
  document.getElementById("loader").style = "width: 100%; height: 100px; display: block;";
}

function getPortfolio(owner, callback) {
  var res = kittytoolbox.getPortfolio(owner)
  callback()

  if (res.hasDB) {
    cats = res.cats
    console.log(res)

    let displayCats = []

    cats.forEach(cat => {
        let show = true;
        if ("kittyId" in filters && filters.kittyId != cat.id) show = false
        if ("selling" in filters && (filters.selling === 'true') != (Object.keys(cat.auction).length > 0)) show = false
        if (show) displayCats.push(cat)
    });

    var optimisticTotal = 0
    var cheapestTotal = 0

    displayCats.forEach(cat => {
        prices = kittytoolbox.getPricesFromAuctions(cat.auctions)
        var median = prices[Math.floor(prices.length/2)]
        var average = prices.reduce((a,b) => {return a+b}) / prices.length
        cat.auctions.median = median
        cat.auctions.average = average
        cat.auctions.prices = prices
        optimisticTotal += Math.min(median, average)
        cheapestTotal += prices[0]
    });

    displayCats.sort((a,b) => {
        return Math.min(b.auctions.average, b.auctions.median) - Math.min(a.auctions.average, a.auctions.median)
    })

    displayTotals(displayCats.length, optimisticTotal.toFixed(2), cheapestTotal.toFixed(2))

    displayCats.forEach(cat => {
      displayCat(cat)
    });
  } else {
    checkPaymentScreen(owner, res)
  }
}

function displayTotals(totalCats, optimisticTotal, cheapestTotal) {
  if (totalCats == cats.length) {
    c.header(`Total cats: `+totalCats)
  } else {
    c.header(`Displaying cats: ${totalCats} (of ${cats.length} total)`)
  }
    c.header(`Optimistic total: ${optimisticTotal} ETH`)
    c.header(`Cheapest total: ${cheapestTotal} ETH`)
    c.log(`Sorted from expensive to cheapest`)
}

function displayCat(cat) {
   var rarity = (kittytoolbox.calculateRarity(cat)*100*100000).toFixed(5)

   priceData = kittytoolbox.processAuctions(cat.auctions, cat, cat.auctions.searchCattributes, cat.auctions.excludedCattributes, cat.auctions.searchLink)

   c.cat(cat.image_url, `#${cat.id} - ${cat.name} - GEN:${cat.generation} - Cooldown:${cat.status.cooldown_index}`,
                        `RARITY: ${rarity}% === ` + kittytoolbox.printCattributes(cat),
                        priceData[0], priceData[1], cat.id, kittytoolbox.colors[cat.color], cat.auction)
}

/* console.log function from: http://www.kobashicomputing.com/send-your-console-output-to-the-result-pane-in-jsfiddle */
var c = function() {
    return({
        log: function(msg) {
          consoleDiv = document.getElementById('console');
          para = document.createElement('p');
          text = document.createTextNode(msg);
          para.appendChild(text);
          consoleDiv.appendChild(para);
        },
        elem: function(elem) {
          consoleDiv = document.getElementById('console');
          consoleDiv.appendChild(elem);
        },
        header: function(msg) {
          consoleDiv = document.getElementById('console');
          para = document.createElement('h2');
          text = document.createTextNode(msg);
          para.appendChild(text);
          consoleDiv.appendChild(para);
        },
        cat: function(img, line1, line2, line3, searchLink, kittyId, color, auction) {
          consoleDiv = document.getElementById('console')

          a = document.createElement('a')
          a.href = ('https://www.cryptokitties.co/kitty/'+kittyId)

          image = document.createElement('img')
          image.src = img
          image.width = 100
          image.height = 100

          div = document.createElement('div')
          div.classList.add('row')
          imgdiv = document.createElement('div')
          imgdiv.classList.add('inline')
          imgdiv.style.backgroundColor = color;
          textdiv = document.createElement('div')
          textdiv.classList.add('inline')

          controlsdiv = document.createElement('div')
          controlsdiv.classList.add('inline')

          pricediv = document.createElement('div')
          pricediv.classList.add('price')

          para1 = document.createElement('p')
          para2 = document.createElement('p')
          para3 = document.createElement('pre')

          text1 = document.createTextNode(line1)
          text2 = document.createTextNode(line2)
          text3 = document.createTextNode(line3)

          search = document.createElement('a')
          search.href = searchLink
          search.appendChild(document.createTextNode('See Searched Auctions'))


          a.appendChild(image)
          imgdiv.appendChild(a)
          para1.appendChild(text1)

          b = document.createElement('b')
          b.appendChild(text2)
          para2.appendChild(b)

          console.log(`metamask = ${user}, cats owner = ${owner}`)
          if (Object.keys(auction).length > 0) {

            link = renderSalePrice(kittytoolbox.fromWei(auction.current_price).toFixed(3), kittyId)
            controlsdiv.appendChild(link)

            if (typeof web3 !== 'undefined') {
              updateButton = document.createElement('button')
              updateButton.innerHTML = 'Reload Price'
              updateButton.style.width = '100px'
              updateButton.style.height = '30px'
              updateButton.style['margin-left'] = '20px'
              updateButton.addEventListener('click',() => {updatePrice(kittyId)}, false)
              updateButton.id = 'updatePrice'+kittyId
              controlsdiv.appendChild(updateButton)

              if (!ownersCats()) {
                buyButton = renderBuyButton(kittyId)
                controlsdiv.appendChild(buyButton)
              } else {
                cancelButton = renderCancelButton(kittyId)
                controlsdiv.appendChild(cancelButton)
              }
            }
          } else {
            if (ownersCats() && (typeof web3 !== 'undefined')) {
              sellButton = document.createElement('button')
              sellButton.innerHTML = 'Sell'
              sellButton.style.width = '200px'
              sellButton.style.height = '50px'
              sellButton.addEventListener('click',() => {sell(kittyId)}, false)
              sellButton.id = 'sell'+kittyId

              controlsdiv.appendChild(sellButton)
            }
          }

          textdiv.appendChild(controlsdiv)
          textdiv.appendChild(para1)
          textdiv.appendChild(para2)

          para3.appendChild(text3)
          pricediv.appendChild(para3)

          pricediv.appendChild(search)

          div.appendChild(imgdiv)
          div.appendChild(textdiv)
          div.appendChild(pricediv)

          consoleDiv.appendChild(div)
        },
        cls: function(msg) {
          consoleDiv = document.getElementById('console');
          consoleDiv.innerHTML='';
        }
    });
}();


window.addEventListener('load', function() {
  setTimeout(getAverageGas, 100)

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
    setInterval(function() {
          if (web3.eth.accounts[0] !== user) {
            updateMetamaskAddress()
          }
    }, 1000);

    setInterval(function() {
      web3.eth.getBalance(user, (error, response) => updateMetamaskBalance(response))
    }, 10000);

  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    //window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  // Now you can start your app & access web3 freely:
  setTimeout(init, 1000)

})

function updateMetamaskAddress() {
  user = web3.eth.accounts[0];
  let obj = document.getElementById("metamaskSpan")
  obj.innerText = user
}

function updateMetamaskBalance(balance) {
  let obj = document.getElementById("balanceSpan")
  obj.innerText = web3.fromWei(balance).toFixed(3)
}

updateQueues()
