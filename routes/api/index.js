var router = require('express').Router();

router.use('/', require('./user'));
router.use('/restaurant', require('./restaurant'));
router.use('/order', require('./order'));

router.use((err, req, res, next) => {
	if (err.name === 'ValidationError') {
		return res.status(422).json({
			errors: Object.keys(err.errors).reduce((errors, key) => {
				errors[key] = err.errors[key].message;

				return errors;
			}, {}),
		});
	}

	return next(err);
});

module.exports = router;
