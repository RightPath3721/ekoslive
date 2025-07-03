import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import * as Sentry from "@sentry/react";
import { initStore, store } from "@redux/store";
import { App } from "./App";
import {
	BrowserRouter,
	useLocation,
	useNavigationType,
	createRoutesFromChildren,
	matchRoutes,
} from "react-router-dom";
import { createRoot } from "react-dom/client";
import storage from "redux-persist/lib/storage";
import { encryptTransform } from "redux-persist-transform-encrypt";
import { appInfo } from "@common/shared/utils/appInfo";
import ACLProvider from "@components/providers/AclProvider";
import ObservatoryRoleProvider from "@components/providers/ObservatoryRoleProvider";

Sentry.init({
	dsn: "https://69cd32d65c8707637624651c661d7e71@o934952.ingest.us.sentry.io/4507096198873088",
	integrations: [
		Sentry.reactRouterV6BrowserTracingIntegration({
			useEffect: React.useEffect,
			useLocation,
			useNavigationType,
			createRoutesFromChildren,
			matchRoutes,
		}),
		Sentry.replayIntegration(),
	],

	tracesSampleRate: 1.0,
	tracePropagationTargets: [
		"https://ekoslive.com/",
		"https://staging.ekoslive.com/",
	],
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 1.0,
	enabled: window.location.hostname !== "localhost",
	beforeSend: (event, hint) =>
	{
		if (
			window.location.hostname === "localhost" ||
			hint.originalException === "Timeout"
		)
		{
			return null;
		}
		return event;
	},
	environment:
		window.location.hostname === "ekoslive.com" ? "production" : "staging",
});

appInfo.init();
const persistor = initStore(storage, encryptTransform);

createRoot(document.getElementById("app")).render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<BrowserRouter>
				<ACLProvider>
					<ObservatoryRoleProvider>
						<App />
					</ObservatoryRoleProvider>
				</ACLProvider>
			</BrowserRouter>
		</PersistGate>
	</Provider>,
);
