// Simple TimePeriodPresets utility test
// Run this with: npx tsx src/utils/time-period-presets-test.ts

import { TimePeriodPresets } from './time-period-presets'

function testTimePeriodPresets() {
  try {
    console.log('🧪 Testing TimePeriodPresets utility...')
    
    // Test 1: Get all presets
    console.log('\n📋 Testing getAllPresets...')
    const allPresets = TimePeriodPresets.getAllPresets()
    console.log(`✅ Retrieved ${allPresets.length} presets`)
    
    // Verify we have the expected presets
    const expectedPresets = [
      '1-month-ago', '3-months-ago', '6-months-ago', '1-year-ago',
      '2-years-ago', '3-years-ago', '5-years-ago', '10-years-ago',
      'college-years', 'high-school-years', 'early-career', 'last-decade'
    ]
    
    const allPresetIds = allPresets.map(p => p.id)
    const missingPresets = expectedPresets.filter(id => !allPresetIds.includes(id as any))
    
    if (missingPresets.length === 0) {
      console.log('✅ All expected presets are present')
    } else {
      console.log(`❌ Missing presets: ${missingPresets.join(', ')}`)
    }
    
    // Test 2: Get specific preset config
    console.log('\n🔍 Testing getPresetConfig...')
    const yearAgoConfig = TimePeriodPresets.getPresetConfig('1-year-ago')
    if (yearAgoConfig && yearAgoConfig.id === '1-year-ago') {
      console.log('✅ Successfully retrieved 1-year-ago preset config')
    } else {
      console.log('❌ Failed to retrieve 1-year-ago preset config')
    }
    
    const invalidConfig = TimePeriodPresets.getPresetConfig('invalid-preset' as any)
    if (invalidConfig === null) {
      console.log('✅ Correctly returned null for invalid preset')
    } else {
      console.log('❌ Should have returned null for invalid preset')
    }
    
    // Test 3: Validate presets
    console.log('\n✅ Testing isValidPreset...')
    if (TimePeriodPresets.isValidPreset('1-year-ago')) {
      console.log('✅ Correctly validated valid preset')
    } else {
      console.log('❌ Failed to validate valid preset')
    }
    
    if (!TimePeriodPresets.isValidPreset('invalid-preset')) {
      console.log('✅ Correctly rejected invalid preset')
    } else {
      console.log('❌ Should have rejected invalid preset')
    }
    
    // Test 4: Convert presets to date ranges
    console.log('\n📅 Testing presetToDateRange...')
    const testDate = new Date('2024-10-17T10:00:00Z')
    
    // Test relative presets
    const oneYearAgo = TimePeriodPresets.presetToDateRange('1-year-ago', testDate)
    console.log(`✅ 1-year-ago range: ${oneYearAgo.start.toISOString()} to ${oneYearAgo.end.toISOString()}`)
    
    if (oneYearAgo.start.getFullYear() === 2023 && oneYearAgo.end.getFullYear() === 2023) {
      console.log('✅ 1-year-ago correctly calculated for 2023')
    } else {
      console.log('❌ 1-year-ago calculation incorrect')
    }
    
    const oneMonthAgo = TimePeriodPresets.presetToDateRange('1-month-ago', testDate)
    console.log(`✅ 1-month-ago range: ${oneMonthAgo.start.toISOString()} to ${oneMonthAgo.end.toISOString()}`)
    
    // Test contextual presets
    const collegeYears = TimePeriodPresets.presetToDateRange('college-years', testDate)
    console.log(`✅ college-years range: ${collegeYears.start.toISOString()} to ${collegeYears.end.toISOString()}`)
    
    const earlyCareer = TimePeriodPresets.presetToDateRange('early-career', testDate)
    console.log(`✅ early-career range: ${earlyCareer.start.toISOString()} to ${earlyCareer.end.toISOString()}`)
    
    // Test error handling
    try {
      TimePeriodPresets.presetToDateRange('invalid-preset' as any, testDate)
      console.log('❌ Should have thrown error for invalid preset')
    } catch (error) {
      console.log('✅ Correctly threw error for invalid preset')
    }
    
    // Test 5: Get relative presets
    console.log('\n⏰ Testing getRelativePresets...')
    const relativePresets = TimePeriodPresets.getRelativePresets()
    const expectedRelativeCount = 8 // 1-month-ago through 10-years-ago
    
    if (relativePresets.length === expectedRelativeCount) {
      console.log(`✅ Retrieved ${relativePresets.length} relative presets`)
    } else {
      console.log(`❌ Expected ${expectedRelativeCount} relative presets, got ${relativePresets.length}`)
    }
    
    // Test 6: Get contextual presets
    console.log('\n🎓 Testing getContextualPresets...')
    const contextualPresets = TimePeriodPresets.getContextualPresets()
    const expectedContextualCount = 4 // college-years, high-school-years, early-career, last-decade
    
    if (contextualPresets.length === expectedContextualCount) {
      console.log(`✅ Retrieved ${contextualPresets.length} contextual presets`)
    } else {
      console.log(`❌ Expected ${expectedContextualCount} contextual presets, got ${contextualPresets.length}`)
    }
    
    // Test 7: Suggest presets based on query
    console.log('\n💡 Testing suggestPresets...')
    
    const collegeSuggestions = TimePeriodPresets.suggestPresets('What was I thinking during college?')
    if (collegeSuggestions.some(p => p.id === 'college-years')) {
      console.log('✅ Correctly suggested college-years for college query')
    } else {
      console.log('❌ Failed to suggest college-years for college query')
    }
    
    const careerSuggestions = TimePeriodPresets.suggestPresets('How did I feel about my first job?')
    if (careerSuggestions.some(p => p.id === 'early-career')) {
      console.log('✅ Correctly suggested early-career for job query')
    } else {
      console.log('❌ Failed to suggest early-career for job query')
    }
    
    const yearSuggestions = TimePeriodPresets.suggestPresets('What was I doing last year?')
    if (yearSuggestions.some(p => p.id === '1-year-ago')) {
      console.log('✅ Correctly suggested 1-year-ago for last year query')
    } else {
      console.log('❌ Failed to suggest 1-year-ago for last year query')
    }
    
    const genericSuggestions = TimePeriodPresets.suggestPresets('Tell me something')
    if (genericSuggestions.length > 0) {
      console.log(`✅ Provided ${genericSuggestions.length} default suggestions for generic query`)
    } else {
      console.log('❌ Should provide default suggestions for generic query')
    }
    
    // Test 8: Validate date range logic
    console.log('\n📊 Testing date range validation...')
    
    // Test that all presets generate valid ranges (start < end)
    let validRanges = 0
    let totalPresets = 0
    
    for (const preset of allPresets) {
      try {
        const range = TimePeriodPresets.presetToDateRange(preset.id, testDate)
        totalPresets++
        
        if (range.start < range.end) {
          validRanges++
        } else {
          console.log(`❌ Invalid range for ${preset.id}: start >= end`)
        }
      } catch (error) {
        console.log(`❌ Error calculating range for ${preset.id}: ${error}`)
      }
    }
    
    if (validRanges === totalPresets) {
      console.log(`✅ All ${totalPresets} presets generate valid date ranges`)
    } else {
      console.log(`❌ Only ${validRanges}/${totalPresets} presets generate valid date ranges`)
    }
    
    console.log('\n🎉 TimePeriodPresets utility tests completed!')
    
  } catch (error) {
    console.error('❌ TimePeriodPresets test failed:', error)
  }
}

if (require.main === module) {
  testTimePeriodPresets()
}