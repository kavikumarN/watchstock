const routes = require('express').Router();
const ASQ = require('asynquence');
const mongoose = require('mongoose');
const Stock = require('../models/stock.js');
const apiReq = require('./api.js');
const getParsedStockData = require('./dataParser.js');
require("asynquence-contrib");

routes.get('/stock/getAllStock', (req, res) => {
  let reqFailed = [];
  // Fetch list of codes from db
  ASQ((done) => {
    Stock.find({}, {_id: 0})
      .exec((err, stocks) => {
        if(err) {
          done.fail(err);
        } else {
          done(stocks);
        }
      });
  })
  // make parallel api requests
  .map((stock, done) => {
    apiReq(stock.code)
    .then(data => {
      done(getParsedStockData(data, stock.id, stock.hide));
    })
    // incase some of req fails then add those failed logs to reqFailed
    // stack so that later the failed logs can be send back to console
    .catch(err => {
      reqFailed.push(`Error while fetching ${url} stock data: ${err}`);
    });
  })
  .val(stocks => {
    res.json(stocks);
  })
  // incase some of the req fails then send those
  // failed req logs back to console
  .then(done => {
    if(reqFailed.length > 0) {
      done.fail(reqFailed);
    } else {
      done();
    }
  })
  .or(err => {
    console.error(`Error: ${err}`);
  });
});
//
// routes.get('/api/:symbol', (req, res) => {
//   apiReq(req.params.symbol)
//   .then(data => {
//     // parsed stock data
//     return getParsedStockData(data);
//   })
//   .catch(err => {
//     console.error(`Error while fetching stock data: ${err}`);
//   });
// });

routes.post('/stock/add', (req, res) => {
  ASQ(req.body.code)
  .then((done, msg) => {
    apiReq(msg)
    .then(data => {
      done(getParsedStockData(data));
    })
    .catch(err => {
      done.fail(`Error while fetching ${msg} stock data: ${err}`);
    });
  })
  .then((done, stockData) => {
    let stock = new Stock();
    stock.hide = false;
    stock.code = stockData.code;
    stock.description = stockData.name;
    stock.id = Math.random();
    done({stock: stock, data: stockData});
  })
  .then((done, stockData) => {
    const stock = stockData.stock;
    const data = stockData.data;
    stock.save((err, doc) => {
      if(err) {
        throw err;
      }
      done({code: doc.code, name: doc.description, hide: doc.hide,
        id: doc.id, data: data.data});
    });
  })
  .val(stock => {
    res.json(stock);
  })
  .or(err => {
    console.error(`Error: ${err}`);
    res.status(404).send(err);
  });
});

routes.delete('/stock/remove', (req, res) => {
  ASQ(req.query.remove)
  .then((done, msg) => {
    Stock.findOneAndRemove({"id": msg})
      .exec(err => {
        if(err) {
          throw err;
        } else {
          done();
        }
      });
  })
  .then((done) => {
    res.status(200).send(`${req.query.remove} stock deleted!`);
    done();
  })
  .or(err => {
    console.error(`Error: ${err}`);
  });
});

routes.delete('/stock/removeAll', (req, res) => {
  ASQ(done => {
    Stock.remove({})
      .exec(err => {
        if(err) {
          throw err;
        } else {
          done();
        }
      });
  })
  .then((done) => {
    res.status(200).send(`All stock removed!`);
    done();
  })
  .or(err => {
    console.error(`Error: ${err}`);
  });
});


module.exports = routes;
