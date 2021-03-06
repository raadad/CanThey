var canThey = require('./canthey');

module.exports = function(){

	function CanTheyExpressMiddlewareUsageError(message){
		this.message = message;
		this.name = "CanTheyExpressMiddlewareUsageError";
	}
	CanTheyExpressMiddlewareUsageError.prototype = Error.prototype;

	var CanTheyExpress = function(opts){
		if(!opts) opts = {};
		this.onRouteCall = opts.onRouteCall;
		this.failureStatusCode = opts.failureStatusCode || 403;
		this.permissionsAttribute = opts.permissionsAttribute || 'userACL';

		this.canTheyOpts = {
			splitBy: opts.splitBy || ":",
			removeSpaces: opts.removeSpaces || true
		};
	};

	CanTheyExpress.prototype.do = function(aclRequired, req, res, next){
		var self = this;
		//If onRouteCall is set, it's straight middleware. If it's not,
		//we need to have the aclRequired attribute
		if(arguments.length == 3 && self.onRouteCall){
			next = res;
			res = req;
			req = aclRequired,
			aclRequired = null;
		} else if(arguments.length != 4){
			throw new CanTheyExpressMiddlewareUsageError('CanTheyExpress requires 3 attributes if onRouteCall is set, 4 othewise: [aclRequired], req, res, next');
		}

		if(self.onRouteCall){
			self.onRouteCall(req, res, function(err, routeACL, permissions){
				if(err) return res.status(self.failureStatusCode).send();

				if(!canThey(routeACL, permissions || req[self.permissionsAttribute], self.canTheyOpts)) return res.status(self.failureStatusCode).send();

				next();
			});
		} else {
			if(!aclRequired) return res.status(self.failureStatusCode).send();
			if(!canThey(aclRequired, req[self.permissionsAttribute], self.canTheyOpts))
				return res.status(self.failureStatusCode).send();
			next(req, res, next);
		}
	};

	return CanTheyExpress;

};
