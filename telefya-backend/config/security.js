// security.js
const helmet = require('helmet');
const config = require('./helmet_config');
console.dir(config.contentSecurityPolicy.directiveValue.connectSrc)
module.exports = function(app) {
    app.use(helmet.contentSecurityPolicy(config.contentSecurityPolicy));
    app.use(helmet.hsts(config.securityHeaders.hsts));
    app.use(helmet.xssFilter(config.securityHeaders.xssFilter));
    app.use(helmet.frameguard(config.securityHeaders.frameguard));
    app.use(helmet.noSniff(config.securityHeaders.noSniff));
    app.use(helmet.permittedCrossDomainPolicies(config.securityHeaders.permittedCrossDomainPolicies));
    app.use(helmet.hidePoweredBy(config.securityHeaders.hidePoweredBy));
    app.use(helmet.ieNoOpen(config.securityHeaders.ieNoOpen));
    app.use(helmet.originAgentCluster(config.securityHeaders.originAgentCluster));
    app.use(helmet.crossOriginEmbedderPolicy(config.securityHeaders.crossOriginEmbedderPolicy));
    app.use(helmet.crossOriginOpenerPolicy(config.securityHeaders.crossOriginOpenerPolicy));
    app.use(helmet.crossOriginResourcePolicy(config.securityHeaders.crossOriginResourcePolicy));
    app.use(helmet.dnsPrefetchControl(config.securityHeaders.dnsPrefetchControl));
   
    app.use(helmet.xXssProtection(config.securityHeaders.xssFilter));
    app.use(helmet.xContentTypeOptions(config.securityHeaders.contentTypeOptions));
    
    app.use((req, res, next) => {
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
    // Rate limiting
    const rateLimit = require('express-rate-limit')({
        windowMs: config.securityHeaders.rateLimit.windowMs,
        max: config.securityHeaders.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            res.status(429).json({
                error: true,
                message: 'Please try again later in  few'+ ' minutes',
            });
        }
    });
    
    app.use('/api/*', rateLimit);
};