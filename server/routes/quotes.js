const quotes = require('./libs/quotes');
module.exports = (config, db) => ({
    rand: (req, res, next) => {
        return res.json({
            success: true,
            quote: quotes[Math.floor(quotes.length * Math.random())]
        });
    }
});
