import { commonUrl, ossStandaloneConfig, ossStandaloneRedisGears } from '../../../helpers/conf';
import { rte } from '../../../helpers/constants';
import { DatabaseAPIRequests } from '../../../helpers/api/api-database';
import { Common } from '../../../helpers/common';
import { BrowserPage, MyRedisDatabasePage, WorkbenchPage } from '../../../pageObjects';
import { DatabaseHelper } from '../../../helpers/database';

const myRedisDatabasePage = new MyRedisDatabasePage();
const workbenchPage = new WorkbenchPage();
const browserPage = new BrowserPage();

const databaseAPIRequests = new DatabaseAPIRequests();
const databaseHelper = new DatabaseHelper();

let { host, port, databaseName, databaseUsername = '', databasePassword = '' } = ossStandaloneRedisGears;

const redisConnect = 'redisinsight://databases/connect';

fixture `Add DB from SM`
    .only
    .meta({ type: 'critical_path', rte: rte.none })
    .afterEach(async() => {
        // Delete all existing connections
        await databaseAPIRequests.deleteAllDatabasesApi();
    })
    .beforeEach(async() => {
        await databaseHelper.acceptLicenseTerms();
    });
test
    .page(commonUrl)('Add DB using url via manual flow', async t => {
        const connectUrlParams = {
            redisUrl: `redis://${databaseUsername}:${databasePassword}@${host}:${port}`,
            databaseAlias: databaseName,
            redirect: 'workbench?guidePath=/quick-guides/document/introduction.md'
        };

        await t.navigateTo(generateLink(connectUrlParams));
        await t.expect(await myRedisDatabasePage.AddRedisDatabase.hostInput.getAttribute('value')).eql(host, 'Wrong host value');
        await t.expect(await myRedisDatabasePage.AddRedisDatabase.portInput.getAttribute('value')).eql(port, 'Wrong port value');
        await t.click(await myRedisDatabasePage.AddRedisDatabase.addRedisDatabaseButton);
        // wait for db is added
        await t.wait(3_000);
        await t.expect(await workbenchPage.closeEnablementPage.exists).ok('Redirection to Workbench tutorial is not correct');
    });

test
    .before(async()  => {
        await databaseHelper.acceptLicenseTermsAndAddDatabaseApi(ossStandaloneRedisGears);
        await browserPage.Cli.sendCommandInCli('acl DELUSER alice');
        await browserPage.Cli.sendCommandInCli('ACL SETUSER alice on >p1pp0 +@all ~*');
    })
    .after(async t => {
        // Delete all existing connections
        await t.click(myRedisDatabasePage.NavigationPanel.myRedisDBButton);
        await myRedisDatabasePage.clickOnDBByName(databaseName);
        await browserPage.Cli.sendCommandInCli('acl DELUSER alice');
        await databaseAPIRequests.deleteAllDatabasesApi();
    })
    .page(commonUrl)('Add DB using url automatically', async t => {
        databaseUsername = 'alice';
        databasePassword = 'p1pp0';
        const connectUrlParams = {
            redisUrl: `redis://${databaseUsername}:${databasePassword}@${host}:${port}`,
            databaseAlias: databaseName,
            redirect: 'workbench?guidePath=/quick-guides/document/introduction.md'
        };

        await t.navigateTo(generateLink(connectUrlParams));
        await t.wait(3_000);
        await t.expect(await workbenchPage.closeEnablementPage.exists).ok('Redirection to Workbench tutorial is not correct');
    });

function generateLink(params: Record<string, any>): string {
    const params1 = Common.generateUrlTParams(params);
    const from = encodeURIComponent(`${redisConnect}?${params1}`);
    return (new URL(`?from=${from}`, commonUrl)).toString();
}

