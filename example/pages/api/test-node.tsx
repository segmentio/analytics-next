import url from 'url';
import { AnalyticsNode } from '../../../'
import { CONFIG_NODE } from '../../config'

export default async function handler(req, res) {
    const q = url.parse(req.url, true).query;
    
    const [nodeAnalytics] = await AnalyticsNode.load({
        writeKey: q.writeKey,
        ...CONFIG_NODE
    })
    
    res.status(200).json(await nodeAnalytics.track('Test Event Node', {
        "color": "orchid",
        "exampleEmail": "Holly59@example.com",
        "ipv6": "4b66:7d19:0615:84bf:039c:4b5e:e1f2:e090",
        "productDescription": "The beautiful range of Apple Naturalé that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients"
    }))
}