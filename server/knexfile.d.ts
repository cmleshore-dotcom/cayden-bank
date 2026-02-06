declare const config: {
    development: {
        client: string;
        connection: {
            filename: string;
        };
        useNullAsDefault: boolean;
        migrations: {
            directory: string;
            extension: string;
        };
        seeds: {
            directory: string;
            extension: string;
        };
    };
    production: {
        client: string;
        connection: {
            filename: string;
        };
        useNullAsDefault: boolean;
        migrations: {
            directory: string;
        };
        seeds: {
            directory: string;
        };
    };
};
export default config;
//# sourceMappingURL=knexfile.d.ts.map