/* @flow */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import throttle from 'lodash.throttle';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import type { Auth, Dispatch, Message, Subscription } from '../types';
import { LoadingIndicator, SearchEmptyState } from '../common';
import { homeNarrow, searchNarrow } from '../utils/narrow';
import MessageList from '../message/MessageList';
import { getMessages } from '../api';
import renderMessages from '../message/renderMessages';
import { NULL_ARRAY, NULL_FETCHING } from '../nullObjects';
import { getAllRealmEmoji, getAuth, getSubscriptions } from '../selectors';

const styles = StyleSheet.create({
  results: {
    flex: 1,
  },
});

type Props = {
  auth: Auth,
  dispatch: Dispatch,
  query: string,
  subscriptions: Subscription[],
};

type State = {
  messages: Message[],
  isFetching: boolean,
};

class SearchMessagesCard extends PureComponent<Props, State> {
  props: Props;
  state: State;

  state = {
    messages: [],
    isFetching: false,
  };

  handleQueryChange = async (query: string) => {
    const { auth } = this.props;

    throttle(async () => {
      this.setState({ isFetching: true });
      const messages = await getMessages(
        auth,
        searchNarrow(query),
        Number.MAX_SAFE_INTEGER,
        20,
        0,
        false,
      );
      this.setState({
        messages,
        isFetching: false,
      });
    }, 500).call(this);
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.query !== this.props.query) {
      this.handleQueryChange(this.props.query);
    }
  }

  render() {
    const { isFetching, messages } = this.state;
    const { query } = this.props;

    if (isFetching) {
      return <LoadingIndicator size={40} />;
    }

    if (messages.length === 0) {
      return query.length > 0 ? <SearchEmptyState text="No results" /> : null;
    }

    const renderedMessages = renderMessages(messages, []);

    return (
      <View style={styles.results}>
        <ActionSheetProvider>
          <MessageList
            anchor={messages[0].id}
            messages={messages}
            narrow={homeNarrow}
            renderedMessages={renderedMessages}
            fetching={NULL_FETCHING}
            isFetching={isFetching}
            showMessagePlaceholders={false}
            typingUsers={NULL_ARRAY}
            {...this.props}
          />
        </ActionSheetProvider>
      </View>
    );
  }
}

export default connect(state => ({
  auth: getAuth(state),
  subscriptions: getSubscriptions(state),
  realmEmoji: getAllRealmEmoji(state),
}))(SearchMessagesCard);
