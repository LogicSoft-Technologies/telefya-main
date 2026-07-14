const { allowedOrigins } = require("./coreOption");

module.exports = {    // Content Security Policy
    contentSecurityPolicy: {
        directiveValue: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", allowedOrigins.join(";")],
            fontSrc: ["'self'", 'data:'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
            workerSrc: ["'self'", 'blob:'],
            frameSrc: ["'self'"],
            childSrc: ["'self'"],
            connectSrc: ["'self'", ...allowedOrigins],
            mediaSrc: ["'self'"],
            frameAncestors: ["'self'"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            manifestSrc: ["'self'"],
            prefetchSrc: ["'self'"],
            navigateTo: ["'self'"],
            reportUri: '/csp-violation',
            reportTo: 'default',
            sandbox: ['allow-forms', 'allow-scripts'],
            reflectedXss: null,
            requireSriFor: ['script', 'style'],
            blockAllMixedContent: true
        }
    },

    // Security Headers
    securityHeaders: {
        // Strict Transport Security
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },

        // Cross-Origin Resource Sharing
        // cors: {
        //     origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'],
        //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        //     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        //     credentials: true,
        //     maxAge: 3600 // 1 hour
        // },

        // Cross-Site Scripting Protection
        xssFilter: true,

        // Clickjacking Protection
        frameguard: {
            action: 'deny'
        },

        // Content Type Options
        contentTypeOptions: true,

        // Referrer Policy
        referrerPolicy: {
            policy: 'same-origin'
        },

        // Feature Policy
        featurePolicy: {
            features: {
                fullscreen: ["'self'"],
                geolocation: ["'self'"],
                microphone: ["'self'"],
                camera: ["'self'"],
                payment: ["'none'"],
                midi: ["'self'"],
                syncXhr: ["'self'"],
                usb: ["'self'"],
                vr: ["'self'"],
                gyroscope: ["'self'"],
                magnetometer: ["'none'"],
                accelerometer: ["'none'"],
                autoplay: ["'self'"],
                encryptedMedia: ["'self'"],
                pictureInPicture: ["'self'"],
                publickeyCredentials: ["'self'"],
                webShare: ["'self'"],
                webBluetooth: ["'self'"],
                webUSB: ["'self'"],
                webNfc: ["'self'"],

            }
        },

        // Rate Limiting
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },

        // Security Headers
        noSniff: true,
        permittedCrossDomainPolicies: false,
        hidePoweredBy: true,
        ieNoOpen: true,
        originAgentCluster: false,
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: true,
        permittedPolicies: true,
        dnsPrefetchControl: true,
        
        expectCt: {
            maxAge: 0,
            enforce: true,
            reportUri: '/ct-report'
        }
    }
};