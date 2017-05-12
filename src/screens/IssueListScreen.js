import React, {Component, PropTypes} from 'react';
import { FlatList, View, StyleSheet, Dimensions, Text } from 'react-native';
import {ButtonGroup} from 'react-native-elements';
import SearchBar from 'react-native-search-bar';

import ViewContainer from '../components/ViewContainer';
import IssueListItem from '../components/IssueListItem';
import LoadingContainer from '../components/LoadingContainer';

import colors from '../config/colors';

import {connect} from 'react-redux';
import {searchOpenRepoIssues, searchClosedRepoIssues} from '../actions/repository';

const mapStateToProps = state => ({
  repository: state.repository.repository,
  searchedOpenIssues: state.repository.searchedOpenIssues,
  searchedClosedIssues: state.repository.searchedClosedIssues,
  isPendingSearchOpenIssues: state.repository.isPendingSearchOpenIssues,
  isPendingSearchClosedIssues: state.repository.isPendingSearchClosedIssues
});

const mapDispatchToProps = dispatch => ({
  searchOpenRepoIssues: (query, repo) => dispatch(searchOpenRepoIssues(query, repo)),
  searchClosedRepoIssues: (query, repo) => dispatch(searchClosedRepoIssues(query, repo)),
});

class IssueList extends Component {
  constructor() {
    super();

    this.state = {
      query: '',
      searchType: 0,
      searchStart: false,
      searchFocus: false,
    };

    this.switchQueryType = this.switchQueryType.bind(this);
    this.search = this.search.bind(this);
    this.getList = this.getList.bind(this);
  }

  switchQueryType(selectedType) {
    if (this.state.searchType !== selectedType) {
      this.setState({
        searchType: selectedType,
      });

      this.search(this.state.query, selectedType);
    }
  }

  search(query, selectedType = null) {
    const {searchOpenRepoIssues, searchClosedRepoIssues, repository} = this.props;

    const selectedSearchType = selectedType !== null
      ? selectedType
      : this.state.searchType;

    if (query !== '') {
      this.setState({
        query: query,
        searchStart: true,
      });

      selectedSearchType === 0 ? searchOpenRepoIssues(query, repository.full_name) : searchClosedRepoIssues(query, repository.full_name);
    }
  }

  renderItem = ({item}) => (
    <IssueListItem
      type={this.props.navigation.state.params.type}
      issue={item}
      userHasPushPermission={this.props.navigation.state.params.userHasPushPermission}
      navigation={this.props.navigation} />
  )

  getList = () => {
    const {searchedOpenIssues, searchedClosedIssues, navigation} = this.props;    
    const {searchType, searchStart} = this.state;
    
    if (searchStart) {
      return searchType === 0 ? searchedOpenIssues : searchedClosedIssues;
    } else {
      return searchType === 0 ? navigation.state.params.issues.filter(issue => issue.state === 'open') : navigation.state.params.issues.filter(issue => issue.state === 'closed');
    }
  }

  render() {
    const {searchedOpenIssues, searchedClosedIssues, isPendingSearchOpenIssues, isPendingSearchClosedIssues} = this.props;
    const {query, searchType, searchStart, searchFocus} = this.state;
    
    return (
      <ViewContainer>
        <View style={styles.header}>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchContainer}>
              <SearchBar
                ref="searchBar"
                hideBackground={true}
                textColor={colors.primaryDark}
                textFieldBackgroundColor={colors.greyLight}
                showsCancelButton={searchFocus}
                onFocus={() => this.setState({searchFocus: true})}
                onCancelButtonPress={() => {
                  this.setState({ searchStart: false, query: '' });
                  this.refs.searchBar.unFocus();
                }}
                onSearchButtonPress={(query) => {
                  this.search(query);
                  this.refs.searchBar.unFocus();
                }}
              />
            </View>
          </View>

          <ButtonGroup
            onPress={this.switchQueryType}
            selectedIndex={searchType}
            buttons={['Open', 'Closed']}
            textStyle={styles.buttonGroupText}
            selectedTextStyle={styles.buttonGroupTextSelected}
            containerStyle={styles.buttonGroupContainer}
          />
        </View>

        {isPendingSearchOpenIssues &&
          searchType === 0 &&
          <LoadingContainer
            animating={isPendingSearchOpenIssues && searchType === 0}
            text={`Searching for ${query}`}
            style={styles.marginSpacing}
          />}

        {isPendingSearchClosedIssues &&
          searchType === 1 &&
          <LoadingContainer
            animating={isPendingSearchClosedIssues && searchType === 1}
            text={`Searching for ${query}`}
            style={styles.marginSpacing}
          />}
        
        {this.getList().length > 0 &&
          <FlatList
            removeClippedSubviews={false}
            data={this.getList()}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
          />
        }

        {searchStart && !isPendingSearchOpenIssues && searchedOpenIssues.length === 0 && searchType === 0 &&
          <View style={styles.marginSpacing}>
            <Text style={styles.searchTitle}>
              No open issues found!
            </Text>
          </View>}

        {searchStart && !isPendingSearchClosedIssues && searchedClosedIssues.length === 0 && searchType === 1 &&
          <View style={styles.marginSpacing}>
            <Text style={styles.searchTitle}>
              No closed issues found!
            </Text>
          </View>}
      </ViewContainer>
    )
  }

  keyExtractor = (item) => {
    return item.id;
  }
}

IssueList.propTypes = {
  repository: PropTypes.object,
  searchedOpenIssues: PropTypes.array,
  searchedClosedIssues: PropTypes.array,
  isPendingSearchOpenIssues: PropTypes.bool,
  isPendingSearchClosedIssues: PropTypes.bool,
  searchOpenRepoIssues: PropTypes.func,
  searchClosedRepoIssues: PropTypes.func,
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  header: {
    borderBottomColor: colors.greyLight,
    borderBottomWidth: 1,
  },
  searchBarWrapper: {
    flexDirection: 'row',
  },
  searchContainer: {
    width: Dimensions.get('window').width,
    backgroundColor: colors.white,
    flex: 1,
  },
  list: {
    marginTop: 0,
  },
  buttonGroupContainer: {
    height: 30,
  },
  buttonGroupText: {
    fontFamily: 'AvenirNext-Bold',
  },
  buttonGroupTextSelected: {
    color: colors.black,
  },
  loadingIndicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  marginSpacing: {
    marginTop: 40,
  },
  searchTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(IssueList);
