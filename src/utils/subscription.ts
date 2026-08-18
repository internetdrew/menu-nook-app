type StoreSubscription = {
  status?: string | null;
  current_period_end?: string | null;
} | null | undefined;

export function isStoreSubscriptionActive(subscription: StoreSubscription) {
  if (subscription?.status !== "active" || !subscription.current_period_end) {
    return false;
  }

  return new Date(subscription.current_period_end) > new Date();
}
