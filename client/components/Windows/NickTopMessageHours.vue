<template>
	<div id="chat-container" class="window top-message-hours">
		<div id="chat">
			<div class="chat-view">
				<div class="header">
					<SidebarToggle />
					<span class="title">Top message hours for {{ nick }}</span>
					<button
						class="close"
						aria-label="Close window"
						title="Close window"
						@click="closeWindow"
					/>
				</div>
				<div class="chat-content">
					<div class="container">
						<div v-if="loading">Loading...</div>
						<div v-else-if="!hasData">No data available.</div>
						<div v-else class="chart-container">
							<div
								v-for="(count, hour) in chartData"
								:key="hour"
								class="bar-container"
							>
								<div
									class="bar"
									:style="{height: `${(count / maxCount) * 100}%`}"
									:title="`${count} messages`"
								></div>
								<div class="label">{{ hour }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
.chart-container {
	display: flex;
	align-items: flex-end;
	height: 300px;
	gap: 5px;
	padding: 20px;
	background: var(--window-bg-color);
}

.bar-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	height: 100%;
	justify-content: flex-end;
}

.bar {
	width: 15px;
	background-color: var(--link-color);
	min-height: 1px;
	transition: height 0.3s ease;
}

.bar:hover {
	opacity: 0.8;
}

.label {
	margin-top: 5px;
	font-size: 0.8em;
	text-align: center;
}

.top-message-hours #chat .chat-content {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}

.top-message-hours #chat .chat-content .container {
	width: fit-content;
}
</style>

<script lang="ts">
import {defineComponent, computed, ref, onMounted, onUnmounted, watch} from "vue";
import {useRoute} from "vue-router";
import {useStore} from "../../js/store";
import socket from "../../js/socket";
import SidebarToggle from "../SidebarToggle.vue";
import {switchToChannel} from "../../js/router";
import {NickTopMessageHoursResponse} from "../../../shared/types/storage";

export default defineComponent({
	name: "NickTopMessageHours",
	components: {
		SidebarToggle,
	},
	setup() {
		const store = useStore();
		const route = useRoute();
		const loading = ref(false);
		const results = ref<{[hour: number]: number}>({});

		const chan = computed(() => {
			const chanId = parseInt(String(route.params.id || ""), 10);
			return store.getters.findChannel(chanId);
		});

		const network = computed(() => {
			return chan.value?.network;
		});

		const channel = computed(() => {
			return chan.value?.channel;
		});

		const nick = computed(() => {
			return route.query.nick as string;
		});

		const chartData = computed(() => {
			// Ensure we have 0-23 hours
			const data: {[hour: number]: number} = {};

			for (let i = 0; i < 24; i++) {
				data[i] = results.value[i] || 0;
			}

			return data;
		});

		const maxCount = computed(() => {
			return Math.max(...Object.values(chartData.value), 1);
		});

		const hasData = computed(() => {
			return Object.keys(results.value).length > 0;
		});

		const fetchData = () => {
			if (!network.value || !nick.value) return;
			loading.value = true;
			socket.emit("nickTopMessageHours", {
				networkUuid: network.value.uuid,
				nick: nick.value,
			});
		};

		const onResults = (data: NickTopMessageHoursResponse) => {
			if (data.networkUuid === network.value?.uuid && data.nick === nick.value) {
				results.value = data.result;
				loading.value = false;
			}
		};

		const closeWindow = () => {
			if (channel.value) {
				switchToChannel(channel.value);
			}
		};

		onMounted(() => {
			socket.on("nickTopMessageHours:results", onResults);
			fetchData();
		});

		onUnmounted(() => {
			socket.off("nickTopMessageHours:results", onResults);
		});

		watch([network, nick], fetchData);

		return {
			nick,
			loading,
			hasData,
			chartData,
			maxCount,
			closeWindow,
		};
	},
});
</script>
