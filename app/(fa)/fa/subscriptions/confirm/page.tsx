import SubscriptionControls from "@/components/subscriptions/SubscriptionControls";
import {subscriptionText} from "@/lib/i18n/subscriptions";
export const metadata={title:subscriptionText("fa").confirm,robots:{index:false,follow:false},referrer:"no-referrer" as const};
export default function Page(){return <SubscriptionControls lang="fa" mode="confirm"/>;}