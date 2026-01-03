import {SharedMsg} from "./msg";

export type SearchQuery = {
	searchTerm: string;
	networkUuid: string;
	channelName: string;
	offset: number;
};

export type SearchResponse = SearchQuery & {
	results: SharedMsg[];
};

export type NickTopMessageHoursData = {
	networkUuid: string;
	nick: string;
};

export type NickTopMessageHoursResponse = NickTopMessageHoursData & {
	result: {[hour: number]: number};
};
