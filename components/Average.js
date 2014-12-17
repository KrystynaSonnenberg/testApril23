'use strict'

var _ = require('lodash')
var React = require('react')
var numeral = require('numeral')
var Router = require('react-router')
var objectAssign = require('object-assign')
var BarchartEnvelope = require('./BarchartEnvelope')

var MapActionCreators = require('../actions/MapActionCreators')
var Store = require('../stores/Store')

var Average = React.createClass({

  displayName: 'Average',

  mixins: [ Router.State, Router.Navigation ],

  getInitialState() {
    return {
      isAverageOpen: false
    }
  },

  componentDidMount() {
    Store.addIndicatorChangeListener(this.handleStoreChange)
    Store.addYearChangeListener(this.handleStoreChange)
    Store.addCountryChangeListener(this.handleStoreChange)

    this.setState({})
  },

  handleStoreChange() {
    this.setState({})
  },

  onCountryClick(countryName) {
    var queries = this.getQuery()
    var _queries = objectAssign(queries, {country: countryName})

    this.replaceWith('app', {}, _queries)
    MapActionCreators.changeSelectedCountry(countryName)
  },

  onBarchartClick(d, i) {
    var selected_indicator = Store.getSelectedIndicator()
    var selectedYear = this.props.data.global.meta.indicators[selected_indicator].years[i]
    MapActionCreators.changeSelectedYear(selectedYear)
  },

  render() {
    var average, Chart, countryList, countryChartBody
    var global = this.props.data.global
    var configs = this.props.data.configs
    var selected_indicator = Store.getSelectedIndicator()
    var selected_year = Store.getSelectedYear()
    var selected_country = Store.getSelectedCountry()
    var onBarchartClick = this.onBarchartClick

    if (!_.isEmpty(selected_indicator) && !_.isEmpty(global)) {
      var indicators = global.data.locations
      // indicator with years
      if (!_.isEmpty(configs) && configs.indicators[selected_indicator].years.length) {
        var selectedIndex = _.indexOf(global.meta.indicators[selected_indicator].years, selected_year)

        countryList = Object.keys(indicators).map(function(countryName, key) {
          var hasData, formattedValue, countryData, countryChart

          if (indicators[countryName][selected_indicator]) {
            formattedValue = numeral(indicators[countryName][selected_indicator].years[selected_year]).format('0,0')
            countryData = _.map(indicators[countryName][selected_indicator].years, function(value) {
              return value
            })

            if (_.contains(countryData, null)) {
              countryChart = 'incomplete data'
            } else {
              countryChart = <BarchartEnvelope data={countryData} width={80} height={20} />
              countryChartBody = <BarchartEnvelope onBarchartClick={onBarchartClick} data={countryData} hoverEffect={true} tooltip={true} width={300} height={80} selectedIndex={selectedIndex} />
            }

            hasData = true
          } else {
            formattedValue = 'No data'
            hasData = false
          }

          return (
            <li key={key} className={ (hasData ? '' : 'empty') + (selected_country == countryName ? ' active' : '') + ' countryItem'}>
              <header onClick={this.onCountryClick.bind(this, countryName)}>
                <span className='label'>{global.meta.locations[countryName].label}</span>
                <span className='value'>{formattedValue}</span>
                <span className='chart'>
                  {countryChart}
                </span>
              </header>
              <div className={(selected_country == countryName ? ' show' : '') + ' detail'}>
                {countryChartBody}
              </div>
            </li>
          )
        }.bind(this))

        if (global.meta.indicators[selected_indicator].avg) {
          var hasInvalidValue = false
          average = numeral(global.meta.indicators[selected_indicator].avg.years[selected_year]).format('0.000')

          var dataSeries = _.map(global.meta.indicators[selected_indicator].avg.years, function(value) {
            if (!value) {
              hasInvalidValue = true
              console.warn(selected_indicator + ' has invalid data')
            } else {
              return value.toFixed(2)
            }
          })

          if (!hasInvalidValue) Chart = <BarchartEnvelope data={dataSeries} width={80} height={20}/>
        }

      // indicator without years
      } else {
        countryList = Object.keys(indicators).map(function(countryName, key) {
          var countryValue = indicators[countryName][selected_indicator]
          var formattedValue = countryValue ? (numeral(countryValue).format('0.000') + '%') : 'No data'

          return (
            <li key={key} className={ (countryValue ? '' : 'empty') + (selected_country == countryName ? ' active' : '') + ' countryItem'} onClick={this.onCountryClick.bind(this, countryName)}>
              <span className='label'>{global.meta.locations[countryName].label}</span>
              <span className='value'>{formattedValue}</span>
            </li>
          )
        }.bind(this))
        average = numeral(global.meta.indicators[selected_indicator].avg).format('0.000') + '%'
      }

    }

    return (
      <section className='drilldown'>
        <header className='header'>
          <span className='label'>Average</span>
          <span className='value'>{average}</span>
          <span className='chart'>{Chart}</span>
        </header>
        <ul className='list'>
          {countryList}
        </ul>
      </section>
    )
  }

})

module.exports = Average