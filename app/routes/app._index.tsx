import { useEffect, useCallback, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Checkbox,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineGrid,
  InlineStack,
  Select,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionTokenHeader, getSessionTokenFromUrlParam } from '@shopify/app-bridge-remix';
import { PrismaClient } from '@prisma/client'
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Set up a default ShopifyStore object to return.
  let obj_shopify_store_record = {
    shop: null,
    isAuthorized: false,
  };

  // Query Shopify's Admin GraphQL API and get back the shop_domain value we need.
  const { admin } = await authenticate.admin(request);
  let res_shopify_admin = await admin.graphql(
    `#graphql
      query {
        shop {
          myshopifyDomain
        }
      }`,
  );
  const obj_shopify_admin_response = await res_shopify_admin.json();

  let shop_domain = obj_shopify_admin_response.data.shop.myshopifyDomain;

  // Query our MySQL database; returns an object or null.
  const prisma = new PrismaClient();
  const getShopifyStore: object | null = await prisma.ShopifyStore.findUnique({
    where: {
      shop: shop_domain,
      isAuthorized: true,
    },
  });
  if ( getShopifyStore != null ) {
    obj_shopify_store_record.shop = getShopifyStore.shop;
    obj_shopify_store_record.isAuthorized = getShopifyStore.isAuthorized;
  }

  return json({ obj_shopify_store_record });
};

export default function Index() {
  let navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  // Use our loader and the Prisma ORM to look for a MySQL record for this store; based on the response,
  // display the Authorization Code form or the simplified Settings page.
  const { obj_shopify_store_record } = useLoaderData();
  if ( obj_shopify_store_record.isAuthorized == false ) {
    const [formState, setFormState] = useState({});
    const [authorizationCodeErrorState, setAuthorizationCodeErrorState] = useState(false);

    return (
      <Page>
        <TitleBar title="Setup: Your Authorization Code" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <Form action="/app/linkstore" method="post">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Setup: Your Authorization Code
                      </Text>

                      <Text as="p" variant="bodyMd">
                        To get started, make sure you've installed the{" "}
                        <Link url="https://web.vestaboard.com/marketplace-listing/9e5d78ae-bf14-46dd-bca9-60f43d9ee0fa/install?deeplink" target="_blank" removeUnderline>Shopify Stats channel</Link>{" "}
                        on your Vestaboard. Once it's installed, a 6-character Authorization Code will be displayed; enter that Authorization Code into the field below. 
                      </Text>

                      <TextField label="Authorization Code" name="auth_code" value={formState.auth_code} onChange={(value) => setFormState({ ...formState, auth_code: value })} autoComplete="off" error={authorizationCodeErrorState} />
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button variant="primary" submit={true}>
                        Submit Authorization Code
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Form>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
  else {
    const [frequencyValue, setFrequencyValue] = useState('3600');

    return (
      <Page>
        <TitleBar title="Settings" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <Form action="/app/settings" method="post">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        To Date Summaries
                      </Text>

                      <Text as="p" variant="bodyMd">
                        Choose the sales summaries you'd like to display on your Vestaboard by checking one or more of the options found below.
                      </Text>

                      <InlineGrid gap="100" columns={4}>
                        <Checkbox
                          label="Today"
                          checked={null}
                          onChange={false}
                        />

                        <Checkbox
                          label="This Week"
                          checked={null}
                          onChange={false}
                        />

                        <Checkbox
                          label="This Month"
                          checked={null}
                          onChange={false}
                        />

                        <Checkbox
                          label="This Year"
                          checked={null}
                          onChange={false}
                        />
                      </InlineGrid>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Message Frequency
                      </Text>

                      <Text as="p" variant="bodyMd">
                        Choose how often you'd like the <b>To Date Summaries</b> you've chosen to be displayed on your Vestaboard.
                      </Text>

                      <Select
                        label="Repeat Every"
                        options={[
                          {label: '10 Minutes', value: '600'},
                          {label: '20 Minutes', value: '1200'},
                          {label: '30 Minutes', value: '1800'},
                          {label: 'Hour', value: '3600'},
                          {label: '2 Hours', value: '7200'},
                          {label: '4 Hours', value: '14400'},
                          {label: 'Day', value: '86400'},
                        ]}
                        onChange={setFrequencyValue}
                        value={frequencyValue}
                      />
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button variant="primary" submit={true}>
                        Save Settings
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Form>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Disconnect From Vestaboard
                    </Text>

                    <Text as="p" variant="bodyMd">
                      Want to change or disconnect from the Vestaboard smart messaging display you're currently connected to? Press the button below and we'll reset your settings.
                    </Text>
                  </BlockStack>
                  <InlineStack gap="300">
                    <Button variant="primary" tone="critical" onClick={() => navigate("/app/disconnectstore")}>
                      Disconnect From Vestaboard
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
}
